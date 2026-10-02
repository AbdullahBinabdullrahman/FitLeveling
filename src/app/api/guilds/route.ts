import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  guilds,
  guildMembers,
  communityProfiles,
  hobbies,
  profiles,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { membershipChange } from "@/lib/guilds";
import { tagsSchema } from "@/lib/interests";
const details = {
  name: z.string().trim().min(2).max(48),
  description: z.string().trim().max(500),
  hobbies: tagsSchema,
};
export async function GET(r: NextRequest) {
  try {
    const u = await requireUser(),
      q = z
        .string()
        .max(80)
        .parse(r.nextUrl.searchParams.get("q") ?? "");
    const list = await db
      .select({
        id: guilds.id,
        name: guilds.name,
        description: guilds.description,
        hobbies: guilds.hobbies,
        ownerId: guilds.ownerId,
        count: sql<number>`(select count(*)::int from guild_members m where m.guild_id=${guilds.id} and m.status='accepted')`,
        status: sql<
          string | null
        >`(select status from guild_members m where m.guild_id=${guilds.id} and m.user_id=${u})`,
      })
      .from(guilds)
      .where(ilike(guilds.name, `%${q.replace(/[\%_]/g, "\\$&")}%`))
      .orderBy(guilds.name)
      .limit(100);
    let selected = null;
    const id = r.nextUrl.searchParams.get("id");
    if (id) {
      z.uuid().parse(id);
      const [g] = await db.select().from(guilds).where(eq(guilds.id, id));
      if (!g) throw Error("NOT_FOUND");
      const [m] = await db
        .select()
        .from(guildMembers)
        .where(and(eq(guildMembers.guildId, id), eq(guildMembers.userId, u)));
      const canSee = g.ownerId === u || m?.status === "accepted";
      const members = canSee
        ? await db
            .select({
              userId: guildMembers.userId,
              status: guildMembers.status,
              alias: communityProfiles.alias,
              hobbies: sql<
                string[]
              >`case when ${guildMembers.status}='accepted' then ${hobbies.tags} else '[]'::jsonb end`,
            })
            .from(guildMembers)
            .leftJoin(
              communityProfiles,
              eq(communityProfiles.userId, guildMembers.userId),
            )
            .leftJoin(hobbies, eq(hobbies.userId, guildMembers.userId))
            .where(
              and(
                eq(guildMembers.guildId, id),
                g.ownerId === u
                  ? sql`${guildMembers.status} in ('pending','accepted')`
                  : eq(guildMembers.status, "accepted"),
              ),
            )
        : [];
      selected = { ...g, status: m?.status ?? null, members };
    }
    return NextResponse.json({ userId: u, list, selected });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: NextRequest) {
  try {
    const u = await requireUser();
    const v = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("create"), ...details }),
        z.object({ action: z.literal("edit"), id: z.uuid(), ...details }),
        z.object({
          action: z.enum(["apply", "cancel", "leave"]),
          id: z.uuid(),
        }),
        z.object({
          action: z.enum(["approve", "reject", "remove"]),
          id: z.uuid(),
          userId: z.uuid(),
        }),
      ])
      .parse(await r.json());
    await db.transaction(async (tx) => {
      if (v.action === "create") {
        await tx
          .select()
          .from(profiles)
          .where(eq(profiles.userId, u))
          .for("update");
        const owned = await tx
          .select()
          .from(guilds)
          .where(eq(guilds.ownerId, u));
        if (owned.length >= 3) throw Error("Maximum 3 owned guilds");
        const [member] = await tx
          .select()
          .from(communityProfiles)
          .where(eq(communityProfiles.userId, u));
        if (!member)
          throw Error("Choose a community nickname first in Leaderboard");
        const [g] = await tx
          .insert(guilds)
          .values({
            ownerId: u,
            name: v.name,
            description: v.description,
            hobbies: v.hobbies,
          })
          .returning();
        await tx
          .insert(guildMembers)
          .values({ guildId: g.id, userId: u, status: "accepted" });
        return;
      }
      const [g] = await tx
        .select()
        .from(guilds)
        .where(eq(guilds.id, v.id))
        .for("update");
      if (!g) throw Error("NOT_FOUND");
      if (v.action === "edit") {
        if (g.ownerId !== u) throw Error("Only the owner can edit this guild");
        await tx
          .update(guilds)
          .set({ name: v.name, description: v.description, hobbies: v.hobbies })
          .where(eq(guilds.id, g.id));
        return;
      }
      const target = "userId" in v ? v.userId : u;
      const [m] = await tx
        .select()
        .from(guildMembers)
        .where(
          and(eq(guildMembers.guildId, g.id), eq(guildMembers.userId, target)),
        );
      if (v.action === "apply") {
        const [publicProfile] = await tx
          .select()
          .from(communityProfiles)
          .where(eq(communityProfiles.userId, u));
        if (!publicProfile)
          throw Error("Choose a community nickname first in Leaderboard");
        if (m?.status === "accepted" || m?.status === "pending") return;
        await tx
          .insert(guildMembers)
          .values({ guildId: g.id, userId: u })
          .onConflictDoUpdate({
            target: [guildMembers.guildId, guildMembers.userId],
            set: { status: "pending" },
          });
        return;
      }
      const count =
        v.action === "approve"
          ? (
              await tx
                .select()
                .from(guildMembers)
                .where(
                  and(
                    eq(guildMembers.guildId, g.id),
                    eq(guildMembers.status, "accepted"),
                  ),
                )
            ).length
          : 0;
      const next = membershipChange(
        g.ownerId,
        u,
        target,
        m?.status,
        v.action,
        count,
      );
      if (next === "delete")
        await tx.delete(guildMembers).where(eq(guildMembers.id, m!.id));
      else
        await tx
          .update(guildMembers)
          .set({ status: next })
          .where(eq(guildMembers.id, m!.id));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
