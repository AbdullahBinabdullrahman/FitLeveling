import { describe, expect, it } from 'vitest';
import { checkinSchema, planSchema } from './training';
const exercise = { name: 'Row', muscleGroup: 'Back', sets: 3, repMin: 8, repMax: 12 };
const plan = { rationale: 'Change equipment', days: [{ name: 'Pull', exercises: [exercise] }] };
describe('training write validation', () => {
  it('accepts a complete plan with new exercises', () => expect(planSchema.parse(plan)).toEqual(plan));
  it('rejects inverted rep ranges', () => expect(planSchema.safeParse({ ...plan, days: [{ name: 'Pull', exercises: [{ ...exercise, repMax: 6 }] }] }).success).toBe(false));
  it('rejects duplicate exercises that would collide in session logging', () => expect(planSchema.safeParse({ ...plan, days: [{ name: 'Pull', exercises: [exercise, { ...exercise, name: 'row' }] }] }).success).toBe(false));
  it('rejects empty or excessive training plans', () => { expect(planSchema.safeParse({ ...plan, days: [] }).success).toBe(false); expect(planSchema.safeParse({ ...plan, days: Array(8).fill(plan.days[0]) }).success).toBe(false); });
  it('validates check-in dates and recovery values', () => {
    const input = { day: '2026-10-02', goal: 'gain', energy: 3, sleepHours: 8, notes: '', preferences: '' };
    expect(checkinSchema.safeParse(input).success).toBe(true);
    expect(checkinSchema.safeParse({ ...input, day: '2026-02-30' }).success).toBe(false);
    expect(checkinSchema.safeParse({ ...input, energy: 6 }).success).toBe(false);
  });
});
