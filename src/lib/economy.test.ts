import { describe, it, expect } from "vitest";
import { treasuryTransfer, workoutRewardEligible } from "./economy";
describe("fixed coin circulation", () => {
  it("preserves supply as rewards move to players and purchases return coins", () => {
    const supply = 10000000;
    let bank = supply - 1000,
      player = 1000;
    const a = treasuryTransfer(bank, supply, 50);
    bank = a.balance;
    player += a.amount;
    expect(bank + player).toBe(supply);
    const b = treasuryTransfer(bank, supply, -300);
    bank = b.balance;
    player += b.amount;
    expect(bank + player).toBe(supply);
    expect(player).toBe(750);
  });
  it("never mints past treasury exhaustion", () => {
    expect(treasuryTransfer(12, 100, 50)).toEqual({ amount: 12, balance: 0 });
    expect(treasuryTransfer(0, 100, 50).amount).toBe(0);
  });
  it("rejects invalid or overfilled transfers", () => {
    expect(() => treasuryTransfer(100, 100, -1)).toThrow();
    expect(() => treasuryTransfer(5, 100, 0.5)).toThrow();
    expect(() => treasuryTransfer(-1, 100, 2)).toThrow();
  });
  it("awards workout rewards once daily", () => {
    expect(workoutRewardEligible(false)).toBe(true);
    expect(workoutRewardEligible(true)).toBe(false);
  });
});
