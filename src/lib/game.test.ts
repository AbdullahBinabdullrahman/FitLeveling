import { describe, expect, it } from "vitest";
import { buildQuests, dayKey, weekDays, weekKey, type GameStats } from "./game";
import {
  builtinReply,
  decryptApiKey,
  encryptApiKey,
  extractResponseText,
} from "./coach";
const stats: GameStats = {
  workouts: 5,
  weeklyWorkouts: 2,
  trainingDays: 1,
  nutritionDays: 3,
  weighIns: 1,
  todayWorkouts: 1,
  todayNutrition: 1,
  level: 3,
  lifetimeXp: 500,
  coins: 100,
};
describe("quest calendar and eligibility", () => {
  it("assigns late-night UTC events to the correct Riyadh day and week", () => {
    const day = dayKey(new Date("2026-10-04T22:00:00Z"), "Asia/Riyadh");
    expect(day).toBe("2026-10-05");
    expect(weekKey(day)).toBe("2026-10-05");
    expect(weekKey("2026-10-04")).toBe("2026-09-28");
  });
  it("handles a DST transition without skipping local calendar days", () => {
    expect(dayKey(new Date("2026-11-01T05:30:00Z"), "America/New_York")).toBe(
      "2026-11-01",
    );
    expect(dayKey(new Date("2026-11-01T06:30:00Z"), "America/New_York")).toBe(
      "2026-11-01",
    );
    expect(weekDays("2026-10-26")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
  it("requires distinct training days to clear the boss, even with many workouts", () => {
    const quests = buildQuests(
      { ...stats, weeklyWorkouts: 9 },
      "u1",
      "2026-10-01",
      new Set(),
    );
    const boss = quests.find((q) => q.id === "weekly-boss")!;
    expect(boss.current).toBeLessThan(boss.target);
    const workoutQuest = quests.find((q) => q.id === "weekly-train")!;
    expect(workoutQuest.current).toBe(workoutQuest.target);
  });
  it("resets daily and weekly claims while preserving lifetime achievements and isolating users", () => {
    const first = buildQuests(stats, "u1", "2026-10-01", new Set());
    const keys = new Set(first.map((q) => q.eventKey));
    expect(
      buildQuests(stats, "u1", "2026-10-01", keys).every((q) => q.claimed),
    ).toBe(true);
    const nextDay = buildQuests(stats, "u1", "2026-10-02", keys);
    expect(nextDay.find((q) => q.kind === "daily")!.claimed).toBe(false);
    expect(nextDay.find((q) => q.kind === "weekly")!.claimed).toBe(true);
    const nextWeek = buildQuests(stats, "u1", "2026-10-05", keys);
    expect(nextWeek.find((q) => q.kind === "weekly")!.claimed).toBe(false);
    expect(nextWeek.find((q) => q.kind === "achievement")!.claimed).toBe(true);
    expect(
      buildQuests(stats, "u2", "2026-10-01", keys).some((q) => q.claimed),
    ).toBe(false);
  });
});
describe("coach keys and responses", () => {
  const secret = "test-only-session-secret-with-32-characters";
  it("encrypts keys with a fresh nonce and rejects tampering or a different secret", () => {
    const key = "sk-example-test-only-123456";
    const encrypted = encryptApiKey(key, secret);
    expect(encrypted).not.toContain(key);
    expect(encryptApiKey(key, secret)).not.toBe(encrypted);
    expect(decryptApiKey(encrypted, secret)).toBe(key);
    expect(() => decryptApiKey(encrypted, secret + "-rotated")).toThrow();
    const parts = encrypted.split(".");
    parts[2] = Buffer.from("tampered-value").toString("base64");
    expect(() => decryptApiKey(parts.join("."), secret)).toThrow();
  });
  it("extracts message text after reasoning output and surfaces refusals", () => {
    expect(
      extractResponseText({
        output: [
          { type: "reasoning" },
          {
            type: "message",
            content: [{ type: "output_text", text: "Rest today." }],
          },
        ],
      }),
    ).toBe("Rest today.");
    expect(
      extractResponseText({
        output: [
          {
            type: "message",
            content: [{ type: "refusal", refusal: "Cannot assist." }],
          },
        ],
      }),
    ).toBe("Cannot assist.");
    expect(extractResponseText({ output: [{ type: "reasoning" }] })).toBe("");
  });
  it("prioritizes recovery over gamification for injury messages", () => {
    const game = {
      stats,
      character: { name: "Nova" },
      quests: [],
    } as unknown as Parameters<typeof builtinReply>[1];
    expect(
      builtinReply("I have knee pain but want to finish the boss", game),
    ).toContain("Pause training");
    expect(builtinReply("I am tired", game)).toContain("don’t lose XP");
    expect(builtinReply("Help me train chest", game)).toContain("Open Train");
  });
});
