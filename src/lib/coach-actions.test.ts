import { describe, it, expect } from "vitest";
import {
  assertFresh,
  assertUnchanged,
  coachProposalSchema,
  parseCoachResponse,
} from "./coach-actions";
import { accountSchema, timezoneSchema } from "./account";
describe("Coach suggestions", () => {
  it("accepts conversational replies without a mutation", () => {
    expect(
      parseCoachResponse("Let's discuss your options.").proposal,
    ).toBeNull();
    expect(
      parseCoachResponse('{"reply":"Tell me more","proposal":null}').reply,
    ).toBe("Tell me more");
  });
  it("rejects unsupported mutation tools", () => {
    expect(() =>
      parseCoachResponse(
        '{"reply":"done","proposal":{"type":"coins","amount":10000}}',
      ),
    ).toThrow("Nothing was saved");
  });
  it("validates training, including rep bounds and duplicates", () => {
    const e = {
      name: "Squat",
      muscleGroup: "Legs",
      sets: 3,
      repMin: 8,
      repMax: 12,
    };
    expect(
      coachProposalSchema.safeParse({
        type: "training",
        plan: { rationale: "Swap", days: [{ name: "Legs", exercises: [e] }] },
      }).success,
    ).toBe(true);
    expect(
      coachProposalSchema.safeParse({
        type: "training",
        plan: {
          rationale: "Swap",
          days: [{ name: "Legs", exercises: [e, e] }],
        },
      }).success,
    ).toBe(false);
  });
  it("rejects malformed targets and estimates outside permitted limits", () => {
    for (const proposal of [
      { type: "targets", calories: 0, proteinMin: 160, proteinMax: 170 },
      { type: "targets", calories: 2200, proteinMin: 180, proteinMax: 160 },
    ])
      expect(coachProposalSchema.safeParse(proposal).success).toBe(false);
  });
  it("requires explicit date and numbers for daily logs", () => {
    expect(
      coachProposalSchema.safeParse({
        type: "nutrition",
        day: "today",
        calories: 2000,
        proteinG: 150,
      }).success,
    ).toBe(false);
    expect(
      coachProposalSchema.safeParse({
        type: "nutrition",
        day: "2026-10-04",
        calories: 2000,
        proteinG: 150,
      }).success,
    ).toBe(true);
  });
  it("rejects handled or expired suggestions", () => {
    const now = new Date("2026-10-04T12:00:00Z");
    expect(() => assertFresh("applied", now, now)).toThrow();
    expect(() =>
      assertFresh("pending", new Date("2026-10-02T12:00:00Z"), now),
    ).toThrow();
    expect(() => assertFresh("pending", now, now)).not.toThrow();
  });
  it("compares JSONB snapshots regardless of property order", () => {
    expect(() =>
      assertUnchanged(
        { proteinMin: 160, calories: 2200 },
        { calories: 2200, proteinMin: 160 },
      ),
    ).not.toThrow();
    expect(() =>
      assertUnchanged({ calories: 2200 }, { calories: 2400 }),
    ).toThrow();
    expect(() => assertUnchanged(null, { calories: 2000 })).toThrow();
  });
  it("rejects invalid weights and oversized hobby lists", () => {
    expect(
      coachProposalSchema.safeParse({ type: "weight", weightKg: 0 }).success,
    ).toBe(false);
    expect(
      coachProposalSchema.safeParse({
        type: "hobbies",
        tags: Array(13).fill("gaming"),
      }).success,
    ).toBe(false);
  });
});
describe("Account validation", () => {
  it("validates IANA timezones", () => {
    expect(timezoneSchema.safeParse("Asia/Riyadh").success).toBe(true);
    expect(timezoneSchema.safeParse("unknown").success).toBe(false);
  });
  it("normalizes emails and enforces password requirements", () => {
    const v = {
      name: "Explorer",
      email: "A@EXAMPLE.COM",
      timezone: "Asia/Riyadh",
    };
    expect(accountSchema.parse(v).email).toBe("a@example.com");
    expect(
      accountSchema.safeParse({ ...v, newPassword: "short" }).success,
    ).toBe(false);
  });
});
