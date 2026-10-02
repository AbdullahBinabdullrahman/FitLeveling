export type Connection = {
  lowUserId: string;
  highUserId: string;
  requestedBy: string;
  status: string;
  blockedBy: string | null;
};
export function friendPair(a: string, b: string) {
  if (a === b) throw new Error("You cannot add yourself");
  return [a, b].sort() as [string, string];
}
export function canMessage(f: Connection, userId: string) {
  return (
    f.status === "accepted" &&
    (f.lowUserId === userId || f.highUserId === userId)
  );
}
export function transition(
  f: Connection,
  userId: string,
  action: "accept" | "decline" | "cancel" | "remove" | "block" | "unblock",
) {
  if (f.lowUserId !== userId && f.highUserId !== userId)
    throw new Error("NOT_FOUND");
  if (action === "unblock") {
    if (f.status !== "blocked" || f.blockedBy !== userId)
      throw new Error("Only the person who blocked can unblock");
    return { status: "removed", blockedBy: null };
  }
  if (f.status === "blocked") throw new Error("This connection is blocked");
  if (action === "block") return { status: "blocked", blockedBy: userId };
  if (action === "accept" || action === "decline") {
    if (f.status !== "pending" || f.requestedBy === userId)
      throw new Error("Only the recipient can respond to a pending request");
    return {
      status: action === "accept" ? "accepted" : "removed",
      blockedBy: null,
    };
  }
  if (action === "cancel") {
    if (f.status !== "pending" || f.requestedBy !== userId)
      throw new Error("Only the sender can cancel a pending request");
    return { status: "removed", blockedBy: null };
  }
  if (f.status !== "accepted") throw new Error("This friendship is not active");
  return { status: "removed", blockedBy: null };
}
