import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { habits, habitChecks, hobbies, profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { dayKey } from "@/lib/game";
import { tagsSchema } from "@/lib/interests";
async function today(userId: string) {
  const [p] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId));
  return dayKey(new Date(), p?.timezone ?? "Asia/Riyadh");
}
export async function GET() {
  try {
    const u = await requireUser(),
      day = await today(u);
    const [h] = await db.select().from(hobbies).where(eq(hobbies.userId, u));
    const rows = await db
      .select({
        id: habits.id,
        name: habits.name,
        done: sql<boolean>`exists(select 1 from habit_checks c where c.habit_id=${habits.id} and c.day=${day})`,
        count: sql<number>`(select count(*)::int from habit_checks c where c.habit_id=${habits.id} and c.day between (${day}::date - 6) and ${day}::date)`,
      })
      .from(habits)
      .where(and(eq(habits.userId, u), eq(habits.active, true)));
    return NextResponse.json({ day, hobbies: h?.tags ?? [], habits: rows });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(r: NextRequest) {
  try {
    const u = await requireUser();
    const v = z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("hobbies"), tags: tagsSchema }),
        z.object({
          action: z.literal("create"),
          name: z.string().trim().min(1).max(80),
        }),
        z.object({
          action: z.enum(["check", "uncheck", "archive"]),
          id: z.uuid(),
        }),
      ])
      .parse(await r.json());
    await db.transaction(async (tx) => {
      await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, u))
        .for("update");
      if (v.action === "hobbies") {
        await tx
          .insert(hobbies)
          .values({ userId: u, tags: v.tags })
          .onConflictDoUpdate({
            target: hobbies.userId,
            set: { tags: v.tags },
          });
        return;
      }
      if (v.action === "create") {
        const rows = await tx
          .select()
          .from(habits)
          .where(and(eq(habits.userId, u), eq(habits.active, true)));
        if (rows.length >= 12) throw Error("Maximum 12 active habits");
        await tx.insert(habits).values({ userId: u, name: v.name });
        return;
      }
      const [h] = await tx
        .select()
        .from(habits)
        .where(
          and(
            eq(habits.id, v.id),
            eq(habits.userId, u),
            eq(habits.active, true),
          ),
        )
        .for("update");
      if (!h) throw Error("NOT_FOUND");
      if (v.action === "archive")
        await tx
          .update(habits)
          .set({ active: false })
          .where(eq(habits.id, h.id));
      else {
        const day = await today(u);
        if (v.action === "check")
          await tx
            .insert(habitChecks)
            .values({ habitId: h.id, day })
            .onConflictDoNothing();
        else
          await tx
            .delete(habitChecks)
            .where(
              and(eq(habitChecks.habitId, h.id), eq(habitChecks.day, day)),
            );
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
