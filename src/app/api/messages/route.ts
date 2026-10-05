import { NextRequest, NextResponse, after } from "next/server";
import { and, eq, gt, lt, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { friendships, directMessages } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { notifySocial } from "@/lib/push";
import { canMessage } from "@/lib/friends";
const chat = z.object({ friendshipId: z.uuid() });
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUser();
    const { friendshipId } = chat.parse({
      friendshipId: request.nextUrl.searchParams.get("friendshipId"),
    });
    const before = z.coerce
      .number()
      .int()
      .positive()
      .max(2147483647)
      .optional()
      .parse(request.nextUrl.searchParams.get("before") ?? undefined);
    const messages = await db.transaction(async (tx) => {
      const [f] = await tx
        .select()
        .from(friendships)
        .where(eq(friendships.id, friendshipId))
        .for("share");
      if (!f || !canMessage(f, userId)) throw new Error("NOT_FOUND");
      return (
        await tx
          .select({
            id: directMessages.id,
            senderId: directMessages.senderId,
            body: directMessages.body,
            createdAt: directMessages.createdAt,
          })
          .from(directMessages)
          .where(
            and(
              eq(directMessages.friendshipId, friendshipId),
              before ? lt(directMessages.id, before) : undefined,
            ),
          )
          .orderBy(desc(directMessages.id))
          .limit(50)
      ).reverse();
    });
    return NextResponse.json({ messages });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    const v = chat
      .extend({ body: z.string().trim().min(1).max(2000), clientId: z.uuid() })
      .parse(await request.json());
    let notifyUser: string | undefined;
    const message = await db.transaction(async (tx) => {
      const [f] = await tx
        .select()
        .from(friendships)
        .where(eq(friendships.id, v.friendshipId))
        .for("update");
      if (!f || !canMessage(f, userId)) throw new Error("NOT_FOUND");
      const [existing] = await tx
        .select()
        .from(directMessages)
        .where(
          and(
            eq(directMessages.senderId, userId),
            eq(directMessages.clientId, v.clientId),
          ),
        );
      if (existing) {
        if (existing.friendshipId !== v.friendshipId)
          throw new Error("Invalid message retry");
        return existing;
      }
      const [recent] = await tx
        .select()
        .from(directMessages)
        .where(
          and(
            eq(directMessages.senderId, userId),
            gt(directMessages.createdAt, new Date(Date.now() - 1000)),
          ),
        )
        .limit(1);
      if (recent) throw new Error("Please wait a moment before sending again");
      const [saved] = await tx
        .insert(directMessages)
        .values({ ...v, senderId: userId })
        .returning();
      notifyUser = f.lowUserId === userId ? f.highUserId : f.lowUserId;
      return saved;
    });
    if (notifyUser) after(() => notifySocial(notifyUser!, "chat"));
    return NextResponse.json({ message });
  } catch (e) {
    return fail(e);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUser();
    const v = chat
      .extend({ lastMessageId: z.number().int().positive() })
      .parse(await request.json());
    await db.transaction(async (tx) => {
      const [f] = await tx
        .select()
        .from(friendships)
        .where(eq(friendships.id, v.friendshipId))
        .for("update");
      if (!f || !canMessage(f, userId)) throw new Error("NOT_FOUND");
      const [m] = await tx
        .select()
        .from(directMessages)
        .where(
          and(
            eq(directMessages.id, v.lastMessageId),
            eq(directMessages.friendshipId, v.friendshipId),
          ),
        );
      if (!m) throw new Error("NOT_FOUND");
      const field = f.lowUserId === userId ? "lowReadAt" : "highReadAt";
      await tx
        .update(friendships)
        .set({
          [field]: sql`greatest(${friendships[field]}, (select created_at from direct_messages where id = ${m.id}))`,
        })
        .where(eq(friendships.id, f.id));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
