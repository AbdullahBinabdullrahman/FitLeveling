import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  communityProfiles,
  communityCheers,
  profiles,
  characters,
  sessions,
  nutrition,
  coachCheckins,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { dayKey, weekKey, weekDays } from "@/lib/game";
import { league, weeklyScore } from "@/lib/community";
function period() {
  const week = weekKey(dayKey(new Date(), "Asia/Riyadh"));
  const end = new Date(weekDays(week)[6] + "T12:00:00Z");
  end.setUTCDate(end.getUTCDate() + 1);
  return { week, next: end.toISOString().slice(0, 10) };
}
export async function GET() {
  try {
    const userId = await requireUser();
    const { week, next } = period();
    const members = await db
      .select({
        userId: communityProfiles.userId,
        alias: communityProfiles.alias,
        level: profiles.level,
        name: characters.name,
        archetype: characters.archetype,
        color: characters.color,
        accessory: characters.accessory,
        skin: characters.skin,
        aura: characters.aura,
        weapon: characters.weapon,
        trinket: characters.trinket,
        vfx: characters.vfx,
      })
      .from(communityProfiles)
      .innerJoin(profiles, eq(profiles.userId, communityProfiles.userId))
      .leftJoin(characters, eq(characters.userId, communityProfiles.userId));
    const [trained, fueled, checked, cheers] = await Promise.all([
      db
        .select({
          userId: sessions.userId,
          count: sql<number>`count(distinct (${sessions.completedAt} at time zone 'Asia/Riyadh')::date)::int`,
        })
        .from(sessions)
        .innerJoin(
          communityProfiles,
          eq(communityProfiles.userId, sessions.userId),
        )
        .where(
          and(
            eq(sessions.status, "completed"),
            gte(sessions.completedAt, new Date(week + "T00:00:00+03:00")),
            lt(sessions.completedAt, new Date(next + "T00:00:00+03:00")),
          ),
        )
        .groupBy(sessions.userId),
      db
        .select({
          userId: nutrition.userId,
          count: sql<number>`count(distinct ${nutrition.day})::int`,
        })
        .from(nutrition)
        .innerJoin(
          communityProfiles,
          eq(communityProfiles.userId, nutrition.userId),
        )
        .where(
          and(
            gte(nutrition.day, week),
            lt(nutrition.day, next),
            sql`${nutrition.day} <= ${dayKey(new Date(), "Asia/Riyadh")}::date`,
          ),
        )
        .groupBy(nutrition.userId),
      db
        .select({
          userId: coachCheckins.userId,
          count: sql<number>`count(distinct ${coachCheckins.day})::int`,
        })
        .from(coachCheckins)
        .innerJoin(
          communityProfiles,
          eq(communityProfiles.userId, coachCheckins.userId),
        )
        .where(
          and(
            gte(coachCheckins.day, week),
            lt(coachCheckins.day, next),
            sql`${coachCheckins.day} <= ${dayKey(new Date(), "Asia/Riyadh")}::date`,
          ),
        )
        .groupBy(coachCheckins.userId),
      db
        .select({
          from: communityCheers.fromUserId,
          to: communityCheers.toUserId,
        })
        .from(communityCheers)
        .where(eq(communityCheers.week, week)),
    ]);
    const counts = (rows: { userId: string; count: number }[], id: string) =>
      Number(rows.find((r) => r.userId === id)?.count ?? 0);
    const sorted = members
      .map((m) => {
        const training = Math.min(3, counts(trained, m.userId)),
          fuel = Math.min(3, counts(fueled, m.userId)),
          checkin = Math.min(3, counts(checked, m.userId));
        const score = weeklyScore(training, fuel, checkin);
        return {
          userId: m.userId,
          alias: m.alias,
          level: m.level,
          score,
          league: league(score),
          training,
          fuel,
          checkin,
          cheers: cheers.filter((c) => c.to === m.userId).length,
          cheered: cheers.some((c) => c.from === userId && c.to === m.userId),
          character: {
            name: m.name ?? "Nova",
            archetype: m.archetype ?? "vanguard",
            color: m.color ?? "mint",
            accessory: m.accessory ?? "none",
            skin: m.skin ?? "default",
            aura: m.aura ?? "none",
            weapon: m.weapon ?? "unarmed",
            trinket: m.trinket ?? "no-trinket",
            vfx: m.vfx ?? "no-vfx",
            animations: false,
          },
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.alias.localeCompare(b.alias) ||
          a.userId.localeCompare(b.userId),
      );
    const ranked = sorted.map((m) => ({
      ...m,
      rank: sorted.findIndex((v) => v.score === m.score) + 1,
    }));
    return NextResponse.json({
      week,
      next,
      userId,
      member: members.find((m) => m.userId === userId)
        ? { alias: members.find((m) => m.userId === userId)!.alias }
        : null,
      leaderboard: ranked.slice(0, 50),
      you: ranked.find((m) => m.userId === userId) ?? null,
      totalMembers: members.length,
      communityScore: ranked.reduce((n, m) => n + m.score, 0),
      communityTarget: Math.max(420, members.length * 200),
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
        z.object({
          action: z.literal("join"),
          alias: z
            .string()
            .trim()
            .min(2)
            .max(24)
            .regex(
              /^[\p{L}\p{N} _-]+$/u,
              "Use letters, numbers, spaces, underscores or hyphens",
            ),
        }),
        z.object({ action: z.literal("leave") }),
        z.object({ action: z.literal("cheer"), toUserId: z.uuid() }),
      ])
      .parse(await request.json());
    const { week } = period();
    await db.transaction(async (tx) => {
      await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .for("update");
      if (v.action === "join") {
        await tx
          .insert(communityProfiles)
          .values({ userId, alias: v.alias })
          .onConflictDoUpdate({
            target: communityProfiles.userId,
            set: { alias: v.alias },
          });
        return;
      }
      if (v.action === "leave") {
        await tx
          .delete(communityProfiles)
          .where(eq(communityProfiles.userId, userId));
        return;
      }
      if (v.toUserId === userId) throw new Error("Cheer another explorer");
      const [self] = await tx
        .select()
        .from(communityProfiles)
        .where(eq(communityProfiles.userId, userId));
      const [target] = await tx
        .select()
        .from(communityProfiles)
        .where(eq(communityProfiles.userId, v.toUserId));
      if (!self || !target)
        throw new Error("Join the community to cheer other members");
      await tx
        .insert(communityCheers)
        .values({ fromUserId: userId, toUserId: v.toUserId, week })
        .onConflictDoNothing();
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
