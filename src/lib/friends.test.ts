import { describe, it, expect } from "vitest";
import { friendPair, canMessage, transition } from "./friends";
const f = {
  lowUserId: "a",
  highUserId: "b",
  requestedBy: "a",
  status: "pending",
  blockedBy: null,
};
describe("friendship authorization", () => {
  it("uses one pair for reciprocal requests and rejects self requests", () => {
    expect(friendPair("b", "a")).toEqual(friendPair("a", "b"));
    expect(() => friendPair("a", "a")).toThrow();
  });
  it("only allows the recipient to accept or decline", () => {
    expect(transition(f, "b", "accept").status).toBe("accepted");
    expect(() => transition(f, "a", "accept")).toThrow();
    expect(() => transition(f, "c", "decline")).toThrow();
  });
  it("allows only the requester to cancel", () => {
    expect(transition(f, "a", "cancel").status).toBe("removed");
    expect(() => transition(f, "b", "cancel")).toThrow();
  });
  it("requires an accepted friendship and participant identity for messaging", () => {
    expect(canMessage(f, "a")).toBe(false);
    expect(canMessage({ ...f, status: "accepted" }, "b")).toBe(true);
    expect(canMessage({ ...f, status: "accepted" }, "c")).toBe(false);
    expect(canMessage({ ...f, status: "blocked" }, "a")).toBe(false);
  });
  it("only the blocker can unblock; unblocking does not restore friendship", () => {
    const blocked = { ...f, ...transition(f, "b", "block") };
    expect(() => transition(blocked, "a", "unblock")).toThrow();
    expect(transition(blocked, "b", "unblock").status).toBe("removed");
    expect(() => transition(blocked, "a", "accept")).toThrow();
  });
  it("prevents accepting old removed requests", () =>
    expect(() =>
      transition({ ...f, status: "removed" }, "b", "accept"),
    ).toThrow());
});
