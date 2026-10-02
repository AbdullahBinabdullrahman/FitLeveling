import { describe, expect, it } from "vitest";
import { weeklyScore, league, COSMETICS } from "./community";
describe("community and collection rules", () => {
  it("caps each habit category so extra training cannot increase weekly score", () => {
    expect(weeklyScore(3, 3, 3)).toBe(420);
    expect(weeklyScore(10, 10, 10)).toBe(420);
    expect(weeklyScore(4, 1, 0)).toBe(320);
  });
  it("allows check-ins to contribute without training", () =>
    expect(weeklyScore(0, 3, 3)).toBe(120));
  it("never awards negative habit scores", () =>
    expect(weeklyScore(-3, 0, -5)).toBe(0));
  it("uses clear league thresholds", () => {
    expect(league(0)).toBe("Explorer");
    expect(league(100)).toBe("Spark");
    expect(league(200)).toBe("Momentum");
    expect(league(360)).toBe("Orbit");
  });
  it("has unique purchasable items with whole positive prices", () => {
    expect(new Set(COSMETICS.map((i) => i.id)).size).toBe(COSMETICS.length);
    expect(
      COSMETICS.every((i) => Number.isInteger(i.price) && i.price > 0),
    ).toBe(true);
  });
});
