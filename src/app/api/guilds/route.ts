import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, sql, or } from "drizzle-orm";
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
import { nicknameSchema } from "@/lib/community-profile";
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
    const summary = {
      id: guilds.id,
      name: guilds.name,
      description: guilds.description,
      hobbies: guilds.hobbies,
      ownerId: guilds.ownerId,
      count: sql<number>`(select count(*)::int from guild_members m where m.guild_id=${guilds.id} and m.status='accepted')`,
      status: sql<
        string | null
      >`(select status from guild_members m where m.guild_id=${guilds.id} and m.user_id=${u})`,
    };
    const [list, mine, membership] = await Promise.all([
      db
        .select(summary)
        .from(guilds)
        .where(ilike(guilds.name, `%${q.replace(/[\%_]/g, "\\$&")}%`))
        .orderBy(guilds.name)
        .limit(100),
      db
        .select(summary)
        .from(guilds)
        .where(
          or(
            eq(guilds.ownerId, u),
            sql`exists(select 1 from guild_members m where m.guild_id=${guilds.id} and m.user_id=${u} and m.status in ('accepted','pending'))`,
          ),
        )
        .orderBy(guilds.name)
        .limit(100),
      db
        .select({ alias: communityProfiles.alias })
        .from(communityProfiles)
        .where(eq(communityProfiles.userId, u)),
    ]);
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
    return NextResponse.json({
      userId: u,
      list,
      mine,
      member: membership[0] ?? null,
      selected,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: NextRequest) {
  try {
    const u = await requireUser();
    const v = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("create"),
          createId: z.uuid(),
          alias: nicknameSchema.optional(),
          ...details,
        }),
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
    const result = await db.transaction(async (tx) => {
      if (v.action === "create") {
        await tx.insert(profiles).values({ userId: u }).onConflictDoNothing();
        await tx
          .select()
          .from(profiles)
          .where(eq(profiles.userId, u))
          .for("update");
        const [existing] = await tx
          .select()
          .from(guilds)
          .where(eq(guilds.id, v.createId));
        if (existing) {
          if (existing.ownerId !== u) throw Error("NOT_FOUND");
          return { guildId: existing.id };
        }
        const owned = await tx
          .select()
          .from(guilds)
          .where(eq(guilds.ownerId, u));
        if (
          owned.some(
            (g) => g.name.toLocaleLowerCase() === v.name.toLocaleLowerCase(),
          )
        )
          throw Error(
            "You already own a guild with this name. Open it from My guilds.",
          );
        if (owned.length >= 3) throw Error("Maximum 3 owned guilds");
        const [member] = await tx
          .select()
          .from(communityProfiles)
          .where(eq(communityProfiles.userId, u));
        if (!member) {
          if (!v.alias)
            throw Error("Choose a public nickname to create your guild");
          await tx
            .insert(communityProfiles)
            .values({ userId: u, alias: v.alias })
            .onConflictDoNothing();
        }
        const [g] = await tx
          .insert(guilds)
          .values({
            id: v.createId,
            ownerId: u,
            name: v.name,
            description: v.description,
            hobbies: v.hobbies,
          })
          .returning();
        await tx
          .insert(guildMembers)
          .values({ guildId: g.id, userId: u, status: "accepted" });
        return { guildId: g.id };
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
          .values({ guildId: g.id, userId: u, status: "pending" })
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
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return fail(e);
  }
}
