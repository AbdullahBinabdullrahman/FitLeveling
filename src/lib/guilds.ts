export function membershipChange(
  ownerId: string,
  actorId: string,
  targetId: string,
  status: string | undefined,
  action: "approve" | "reject" | "remove" | "leave" | "cancel",
  count = 0,
): "accepted" | "rejected" | "delete" {
  if (!status) throw Error("NOT_FOUND");
  if (action === "approve" || action === "reject" || action === "remove") {
    if (actorId !== ownerId || targetId === ownerId)
      throw Error("Only the owner can manage other members");
    if (status !== (action === "remove" ? "accepted" : "pending"))
      throw Error("Request has already changed");
    if (action === "approve" && count >= 100) throw Error("Guild is full");
    return action === "approve" ? "accepted" : "rejected";
  }
  if (actorId !== targetId || actorId === ownerId)
    throw Error("The owner must stay in their guild");
  if (status !== (action === "cancel" ? "pending" : "accepted"))
    throw Error("Membership has already changed");
  return "delete";
}
