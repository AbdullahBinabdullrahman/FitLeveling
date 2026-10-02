import { describe, it, expect } from "vitest";
import { membershipChange } from "./guilds";
import { tagsSchema } from "./interests";
describe("Closed guild membership", () => {
  it("requires owner approval", () => {
    expect(
      membershipChange("owner", "owner", "member", "pending", "approve"),
    ).toBe("accepted");
    expect(() =>
      membershipChange("owner", "member", "member", "pending", "approve"),
    ).toThrow();
  });
  it("rejects stale approval and prevents removing the owner", () => {
    expect(() =>
      membershipChange("owner", "owner", "member", "accepted", "approve"),
    ).toThrow();
    expect(() =>
      membershipChange("owner", "owner", "owner", "accepted", "remove"),
    ).toThrow();
  });
  it("allows rejection and accepted-member removal", () => {
    expect(membershipChange("o", "o", "m", "pending", "reject")).toBe(
      "rejected",
    );
    expect(membershipChange("o", "o", "m", "accepted", "remove")).toBe(
      "rejected",
    );
  });
  it("permits only own cancel and leave", () => {
    expect(membershipChange("o", "m", "m", "pending", "cancel")).toBe("delete");
    expect(membershipChange("o", "m", "m", "accepted", "leave")).toBe("delete");
    expect(() =>
      membershipChange("o", "x", "m", "accepted", "leave"),
    ).toThrow();
    expect(() =>
      membershipChange("o", "o", "o", "accepted", "leave"),
    ).toThrow();
  });
  it("enforces capacity", () => {
    expect(() =>
      membershipChange("o", "o", "m", "pending", "approve", 100),
    ).toThrow("Guild is full");
  });
});
describe("hobby tags", () => {
  it("deduplicates normalized hobbies", () => {
    expect(tagsSchema.parse([" Hiking ", "hiking", "Gaming"])).toEqual([
      "hiking",
      "Gaming",
    ]);
  });
  it("limits size and rejects empty hobbies", () => {
    expect(tagsSchema.safeParse([""]).success).toBe(false);
    expect(tagsSchema.safeParse(Array(13).fill("a")).success).toBe(false);
  });
});
