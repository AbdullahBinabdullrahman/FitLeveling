import { describe, expect, it } from "vitest";
import { checkinSchema, planSchema } from "./training";
const exercise = {
  name: "Row",
  muscleGroup: "Back",
  tracking: "reps",
  sets: 3,
  repMin: 8,
  repMax: 12,
};
const plan = {
  rationale: "Change equipment",
  days: [{ name: "Pull", exercises: [exercise] }],
};
describe("training write validation", () => {
  it("accepts a complete plan with new exercises", () =>
    expect(planSchema.parse(plan)).toEqual(plan));
  it("rejects inverted rep ranges", () =>
    expect(
      planSchema.safeParse({
        ...plan,
        days: [{ name: "Pull", exercises: [{ ...exercise, repMax: 6 }] }],
      }).success,
    ).toBe(false));
  it("rejects duplicate exercises that would collide in session logging", () =>
    expect(
      planSchema.safeParse({
        ...plan,
        days: [
          { name: "Pull", exercises: [exercise, { ...exercise, name: "row" }] },
        ],
      }).success,
    ).toBe(false));
  it("rejects empty or excessive training plans", () => {
    expect(planSchema.safeParse({ ...plan, days: [] }).success).toBe(false);
    expect(
      planSchema.safeParse({ ...plan, days: Array(8).fill(plan.days[0]) })
        .success,
    ).toBe(false);
  });
  it("validates check-in dates and recovery values", () => {
    const input = {
      day: "2026-10-02",
      goal: "gain",
      energy: 3,
      sleepHours: 8,
      notes: "",
      preferences: "",
    };
    expect(checkinSchema.safeParse(input).success).toBe(true);
    expect(
      checkinSchema.safeParse({ ...input, day: "2026-02-30" }).success,
    ).toBe(false);
    expect(checkinSchema.safeParse({ ...input, energy: 6 }).success).toBe(
      false,
    );
  });
});

describe("flexible exercise prescriptions", () => {
  const parse = (e: unknown) =>
    planSchema.safeParse({
      rationale: "Mixed training",
      days: [{ name: "Mixed", exercises: [e] }],
    });
  it("accepts treadmill time without reps or weight", () =>
    expect(
      parse({
        name: "Treadmill",
        muscleGroup: "Cardio",
        sets: 1,
        tracking: "duration",
        durationSeconds: 1200,
        speedKph: 6,
        inclinePercent: 3,
      }).success,
    ).toBe(true));
  it("accepts distance and intervals", () => {
    expect(
      parse({
        name: "Run",
        muscleGroup: "Cardio",
        sets: 1,
        tracking: "distance",
        distanceMeters: 5000,
      }).success,
    ).toBe(true);
    expect(
      parse({
        name: "Bike",
        muscleGroup: "Cardio",
        sets: 8,
        tracking: "intervals",
        durationSeconds: 30,
        restSeconds: 60,
      }).success,
    ).toBe(true);
  });
  it("rejects missing metrics and time disguised as reps", () => {
    expect(
      parse({
        name: "Run",
        muscleGroup: "Cardio",
        sets: 1,
        tracking: "duration",
      }).success,
    ).toBe(false);
    expect(
      parse({
        name: "Plank",
        muscleGroup: "Core",
        sets: 3,
        tracking: "duration",
        durationSeconds: 60,
        repMin: 60,
        repMax: 60,
      }).success,
    ).toBe(false);
    expect(
      parse({
        name: "Bike",
        muscleGroup: "Cardio",
        sets: 3,
        tracking: "intervals",
        durationSeconds: 30,
      }).success,
    ).toBe(false);
  });
});
