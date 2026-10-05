import { circulateCoins, workoutRewardEligible } from "@/lib/economy";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  exercises,
  templateExercises,
  templates,
  sessions,
  sets,
  profiles,
  xpTransactions,
  coinTransactions,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { levelFromXp } from "@/lib/domain";
import { fail } from "@/lib/http";
export async function GET() {
  try {
    const id = await requireUser();
    await db.insert(profiles).values({ userId: id }).onConflictDoNothing();
    const [plan, history, profile, active] = await Promise.all([
      db
        .select({
          templateId: templates.id,
          templateName: templates.name,
          exerciseId: exercises.id,
          exerciseName: exercises.name,
          position: templateExercises.position,
          sets: templateExercises.sets,
          repMin: templateExercises.repMin,
          repMax: templateExercises.repMax,
        })
        .from(templateExercises)
        .innerJoin(templates, eq(templates.id, templateExercises.templateId))
        .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
        .where(and(eq(templates.active, true), eq(templates.userId, id)))
        .orderBy(templates.position, templateExercises.position),
      db
        .select()
        .from(sessions)
        .where(and(eq(sessions.userId, id), eq(sessions.status, "completed")))
        .orderBy(desc(sessions.completedAt))
        .limit(30),
      db.select().from(profiles).where(eq(profiles.userId, id)),
      db
        .select()
        .from(sessions)
        .where(and(eq(sessions.userId, id), eq(sessions.status, "active")))
        .limit(1),
    ]);
    const systemPlan = await db
      .select({
        templateId: templates.id,
        templateName: templates.name,
        exerciseId: exercises.id,
        exerciseName: exercises.name,
        position: templateExercises.position,
        sets: templateExercises.sets,
        repMin: templateExercises.repMin,
        repMax: templateExercises.repMax,
      })
      .from(templateExercises)
      .innerJoin(templates, eq(templates.id, templateExercises.templateId))
      .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
      .where(and(eq(templates.active, true), isNull(templates.userId)))
      .orderBy(templates.position, templateExercises.position);
    const past = await db
      .select({
        exerciseId: sets.exerciseId,
        weightKg: sets.weightKg,
        reps: sets.reps,
        completedAt: sets.completedAt,
      })
      .from(sets)
      .innerJoin(sessions, eq(sets.sessionId, sessions.id))
      .where(and(eq(sessions.userId, id), eq(sessions.status, "completed")))
      .orderBy(desc(sets.completedAt))
      .limit(500);
    const activePlan = active[0]
      ? await db
          .select({
            templateId: templates.id,
            templateName: templates.name,
            exerciseId: exercises.id,
            exerciseName: exercises.name,
            position: templateExercises.position,
            sets: templateExercises.sets,
            repMin: templateExercises.repMin,
            repMax: templateExercises.repMax,
          })
          .from(templateExercises)
          .innerJoin(templates, eq(templates.id, templateExercises.templateId))
          .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
          .where(eq(templates.id, active[0].templateId))
          .orderBy(templateExercises.position)
      : [];
    const activeSets = active[0]
      ? await db.select().from(sets).where(eq(sets.sessionId, active[0].id))
      : [];
    return NextResponse.json({
      plan: [
        ...(plan.length ? plan : systemPlan),
        ...activePlan.filter(
          (p) =>
            !(plan.length ? plan : systemPlan).some(
              (v) => v.templateId === p.templateId,
            ),
        ),
      ],
      history,
      profile: profile[0],
      active: active[0] ?? null,
      activeSets,
      past,
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const id = await requireUser();
    const { templateId } = z
      .object({ templateId: z.uuid() })
      .parse(await request.json());
    const [template] = await db
      .select()
      .from(templates)
      .where(eq(templates.id, templateId));
    if (
      !template ||
      !template.active ||
      (template.userId && template.userId !== id)
    )
      throw new Error("NOT_FOUND");
    const [existing] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, id), eq(sessions.status, "active")));
    if (existing) return NextResponse.json({ session: existing });
    const [session] = await db
      .insert(sessions)
      .values({ userId: id, templateId })
      .returning();
    return NextResponse.json({ session });
  } catch (e) {
    return fail(e);
  }
}
const setInput = z.object({
  sessionId: z.uuid(),
  exerciseId: z.uuid(),
  setNumber: z.number().int().min(1).max(20),
  weightKg: z.number().min(0).max(500),
  reps: z.number().int().min(1).max(100),
});
export async function PATCH(request: NextRequest) {
  try {
    const id = await requireUser();
    const v = setInput.parse(await request.json());
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, v.sessionId),
          eq(sessions.userId, id),
          eq(sessions.status, "active"),
        ),
      );
    if (!session) throw new Error("NOT_FOUND");
    const [allowed] = await db
      .select()
      .from(templateExercises)
      .where(
        and(
          eq(templateExercises.templateId, session.templateId),
          eq(templateExercises.exerciseId, v.exerciseId),
        ),
      );
    if (!allowed || v.setNumber > allowed.sets) throw new Error("Invalid set");
    await db
      .insert(sets)
      .values({
        sessionId: v.sessionId,
        exerciseId: v.exerciseId,
        setNumber: v.setNumber,
        weightKg: String(v.weightKg),
        reps: v.reps,
      })
      .onConflictDoUpdate({
        target: [sets.sessionId, sets.exerciseId, sets.setNumber],
        set: { weightKg: String(v.weightKg), reps: v.reps },
      });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
export async function PUT(request: NextRequest) {
  try {
    const id = await requireUser();
    const { sessionId } = z
      .object({ sessionId: z.uuid() })
      .parse(await request.json());
    const result = await db.transaction(async (tx) => {
      const [session] = await tx
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, id)))
        .for("update");
      if (!session) throw new Error("NOT_FOUND");
      if (session.status === "completed")
        return { alreadyCompleted: true, xp: 0, coins: 0, prs: 0 };
      const logged = await tx
        .select()
        .from(sets)
        .where(eq(sets.sessionId, sessionId));
      if (logged.length < 3) throw new Error("Log at least three sets");
      const older = await tx
        .select({
          exerciseId: sets.exerciseId,
          weightKg: sets.weightKg,
          reps: sets.reps,
        })
        .from(sets)
        .innerJoin(sessions, eq(sets.sessionId, sessions.id))
        .where(
          and(
            eq(sessions.userId, id),
            eq(sessions.status, "completed"),
            inArray(
              sets.exerciseId,
              logged.map((s) => s.exerciseId),
            ),
          ),
        );
      const best = new Map<string, number>();
      for (const s of older)
        best.set(
          s.exerciseId,
          Math.max(
            best.get(s.exerciseId) ?? 0,
            Number(s.weightKg) * (1 + s.reps / 30),
          ),
        );
      const prs = new Set(
        logged
          .filter(
            (s) =>
              Number(s.weightKg) * (1 + s.reps / 30) >
              (best.get(s.exerciseId) ?? 0),
          )
          .map((s) => s.exerciseId),
      ).size;
      const plan = await tx
        .select()
        .from(templateExercises)
        .where(eq(templateExercises.templateId, session.templateId));
      const complete = logged.length >= plan.reduce((n, p) => n + p.sets, 0);
      let xp = 100 + (complete ? 25 : 0) + Math.min(prs, 3) * 30;
      let coins = 20 + Math.min(prs, 3) * 10;
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, id))
        .for("update");
      const [rewardedToday] = await tx
        .select({ id: xpTransactions.id })
        .from(xpTransactions)
        .where(
          and(
            eq(xpTransactions.userId, id),
            eq(xpTransactions.reason, "workout"),
            gt(xpTransactions.amount, 0),
            sql`(${xpTransactions.createdAt} at time zone ${profile.timezone})::date = (now() at time zone ${profile.timezone})::date`,
          ),
        )
        .limit(1);
      const rewardEligible = workoutRewardEligible(!!rewardedToday);
      if (!rewardEligible) {
        xp = 0;
        coins = 0;
      }
      const prevLevel = profile.level;
      const nextXp = profile.lifetimeXp + xp;
      const nextLevel = levelFromXp(nextXp).level;
      const levelCoins = (nextLevel - prevLevel) * 50;
      const awardedCoins = await circulateCoins(tx, coins + levelCoins);
      await tx
        .update(sessions)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(sessions.id, sessionId));
      await tx.insert(xpTransactions).values({
        userId: id,
        amount: xp,
        reason: "workout",
        eventKey: `workout:${sessionId}`,
      });
      await tx.insert(coinTransactions).values({
        userId: id,
        amount: awardedCoins,
        reason: "workout and level",
        eventKey: `workout:${sessionId}`,
      });
      await tx
        .update(profiles)
        .set({
          lifetimeXp: nextXp,
          level: nextLevel,
          coins: profile.coins + awardedCoins,
        })
        .where(eq(profiles.userId, id));
      return {
        xp,
        coins: awardedCoins,
        prs,
        levelUp: nextLevel > prevLevel,
        rewardEligible,
      };
    });
    return NextResponse.json(result);
  } catch (e) {
    return fail(e);
  }
}
