import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, or, sql, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { friendships, communityProfiles, profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { friendPair, transition } from "@/lib/friends";
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUser();
    const query = z
      .string()
      .trim()
      .max(50)
      .parse(request.nextUrl.searchParams.get("q") ?? "");
    const rows = await db
      .select({
        id: friendships.id,
        lowUserId: friendships.lowUserId,
        highUserId: friendships.highUserId,
        requestedBy: friendships.requestedBy,
        status: friendships.status,
        blockedBy: friendships.blockedBy,
        updatedAt: friendships.updatedAt,
        alias: communityProfiles.alias,
        unread: sql<number>`(select count(*)::int from direct_messages m where m.friendship_id=${friendships.id} and m.sender_id<>${userId} and m.created_at>coalesce(case when ${friendships.lowUserId}=${userId} then ${friendships.lowReadAt} else ${friendships.highReadAt} end, 'epoch'::timestamptz))`,
      })
      .from(friendships)
      .leftJoin(
        communityProfiles,
        eq(
          communityProfiles.userId,
          sql`case when ${friendships.lowUserId}=${userId} then ${friendships.highUserId} else ${friendships.lowUserId} end`,
        ),
      )
      .where(
        and(
          or(
            eq(friendships.lowUserId, userId),
            eq(friendships.highUserId, userId),
          ),
          ne(friendships.status, "removed"),
        ),
      );
    const [membership] = await db
      .select()
      .from(communityProfiles)
      .where(eq(communityProfiles.userId, userId));
    const people =
      membership && query.length >= 2
        ? await db
            .select({
              userId: communityProfiles.userId,
              alias: communityProfiles.alias,
            })
            .from(communityProfiles)
            .where(
              and(
                ne(communityProfiles.userId, userId),
                ilike(
                  communityProfiles.alias,
                  `%${query.replace(/[\\%_]/g, "\\$&")}%`,
                ),
              ),
            )
            .limit(20)
        : [];
    return NextResponse.json({
      userId,
      joined: !!membership,
      connections: rows
        .filter((f) => f.status !== "blocked" || f.blockedBy === userId)
        .map((f) => ({
          id: f.id,
          userId: f.lowUserId === userId ? f.highUserId : f.lowUserId,
          alias: f.alias ?? "Explorer",
          status: f.status,
          incoming: f.requestedBy !== userId,
          unread: f.status === "accepted" ? Number(f.unread) : 0,
        })),
      people: people.filter(
        (p) =>
          !rows.some(
            (f) =>
              f.status === "blocked" &&
              (f.lowUserId === p.userId || f.highUserId === p.userId),
          ),
      ),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    const v = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("request"), toUserId: z.uuid() }),
        z.object({
          action: z.enum([
            "accept",
            "decline",
            "cancel",
            "remove",
            "block",
            "unblock",
          ]),
          friendshipId: z.uuid(),
        }),
      ])
      .parse(await request.json());
    await db.transaction(async (tx) => {
      if (v.action === "request") {
        const [lowUserId, highUserId] = friendPair(userId, v.toUserId);
        await tx.execute(
          sql`select pg_advisory_xact_lock(hashtext(${lowUserId + ":" + highUserId}))`,
        );
        const members = await tx
          .select()
          .from(communityProfiles)
          .where(
            or(
              eq(communityProfiles.userId, userId),
              eq(communityProfiles.userId, v.toUserId),
            ),
          );
        if (members.length !== 2)
          throw new Error("Both explorers must join the community first");
        const [old] = await tx
          .select()
          .from(friendships)
          .where(
            and(
              eq(friendships.lowUserId, lowUserId),
              eq(friendships.highUserId, highUserId),
            ),
          )
          .for("update");
        if (old && old.status !== "removed") {
          if (old.status === "blocked")
            throw new Error("This connection is unavailable");
          return;
        }
        await tx
          .insert(friendships)
          .values({ lowUserId, highUserId, requestedBy: userId })
          .onConflictDoUpdate({
            target: [friendships.lowUserId, friendships.highUserId],
            set: {
              status: "pending",
              requestedBy: userId,
              blockedBy: null,
              updatedAt: new Date(),
            },
          });
        return;
      }
      const [f] = await tx
        .select()
        .from(friendships)
        .where(eq(friendships.id, v.friendshipId))
        .for("update");
      if (!f) throw new Error("NOT_FOUND");
      await tx
        .update(friendships)
        .set({ ...transition(f, userId, v.action), updatedAt: new Date() })
        .where(eq(friendships.id, f.id));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
