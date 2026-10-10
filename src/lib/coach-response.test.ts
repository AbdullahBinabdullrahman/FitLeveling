import { describe, it, expect, vi } from "vitest";
import { recoverCoachResponse } from "./coach-response";
const bad = JSON.stringify({
  reply: "Try circuits instead.",
  proposal: { type: "training", plan: { days: [] } },
});
describe("Coach response recovery", () => {
  it("repairs malformed JSON once and returns a valid proposal", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce('{"reply":')
      .mockResolvedValueOnce(
        '{"reply":"Review this goal","proposal":{"type":"goal","goal":"lose"}}',
      );
    const report = vi.fn();
    const result = await recoverCoachResponse(
      request,
      "change my goal",
      report,
    );
    expect(result.proposal).toEqual({ type: "goal", goal: "lose" });
    expect(request.mock.calls[0]).toEqual([false, undefined]);
    expect(request.mock.calls[1][1]).toMatchObject({ issues: [{ path: "response", code: "invalid_json" }] });
    expect(report).toHaveBeenCalledWith(1, [
      { path: "response", code: "invalid_json" },
    ]);
  });
  it("blocks invalid plans and misleading reply text after retry", async () => {
    const request = vi.fn().mockResolvedValue(bad);
    const report = vi.fn();
    const result = await recoverCoachResponse(
      request,
      "I am bored with lifting",
      report,
    );
    expect(result.reply).not.toContain("Try circuits instead.");
    expect(result.reply).toContain("saved data is unchanged");
    expect(result.proposal).toBeNull();
    expect(request).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(report.mock.calls)).not.toContain("Try circuits");
  });
  it("returns an honest failure when the repair provider fails", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(bad)
      .mockRejectedValueOnce(Error("offline"));
    expect(
      (await recoverCoachResponse(request, "hello", vi.fn())).reply,
    ).toContain("saved data is unchanged");
  });
  it("does not tell users to Apply when an invalid draft cannot be repaired", async () => {
    const raw = JSON.stringify({ reply: "Your plan is ready. Click Apply to save it.", proposal: { type: "training", plan: { days: [] } } });
    const result = await recoverCoachResponse(vi.fn().mockResolvedValue(raw), "adjust my training", vi.fn());
    expect(result.proposal).toBeNull();
    expect(result.reply).not.toContain("Click Apply");
    expect(result.reply).not.toContain("Your plan is ready");
  });
  it("never exposes malformed JSON as a chat reply", async () => {
    const result = await recoverCoachResponse(
      vi.fn().mockResolvedValue('{"reply":'),
      "مرحبا",
      vi.fn(),
    );
    expect(result.proposal).toBeNull();
    expect(result.reply).toContain("لم تتغير بياناتك");
    expect(result.reply).not.toContain('{"reply":');
  });
  it("does not retry normal chat or hide initial provider failures", async () => {
    const request = vi
      .fn()
      .mockResolvedValue('{"reply":"Tell me more","proposal":null}');
    expect(await recoverCoachResponse(request, "hello", vi.fn())).toEqual({
      reply: "Tell me more",
      proposal: null,
    });
    expect(request).toHaveBeenCalledTimes(1);
    await expect(
      recoverCoachResponse(
        vi.fn().mockRejectedValue(Error("invalid key")),
        "hello",
        vi.fn(),
      ),
    ).rejects.toThrow("invalid key");
  });
});
