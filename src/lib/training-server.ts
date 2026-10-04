import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  coachCheckins,
  trainingVersions,
  profiles,
  inbodyScans,
  templates,
  templateExercises,
  exercises,
  sessions,
  sets,
} from "@/db/schema";
import type { TrainingPlan } from "./training";
export async function trainingContext(userId: string) {
  const [profile, scans, checkins, versions, personal, standard, history] =
    await Promise.all([
      db.select().from(profiles).where(eq(profiles.userId, userId)),
      db
        .select()
        .from(inbodyScans)
        .where(eq(inbodyScans.userId, userId))
        .orderBy(desc(inbodyScans.measuredAt))
        .limit(3),
      db
        .select()
        .from(coachCheckins)
        .where(eq(coachCheckins.userId, userId))
        .orderBy(desc(coachCheckins.day))
        .limit(14),
      db
        .select()
        .from(trainingVersions)
        .where(eq(trainingVersions.userId, userId))
        .orderBy(desc(trainingVersions.createdAt))
        .limit(10),
      db
        .select()
        .from(templates)
        .where(and(eq(templates.userId, userId), eq(templates.active, true)))
        .orderBy(templates.position),
      db
        .select()
        .from(templates)
        .where(and(isNull(templates.userId), eq(templates.active, true)))
        .orderBy(templates.position),
      db
        .select({
          exercise: exercises.name,
          weightKg: sets.weightKg,
          reps: sets.reps,
          completedAt: sets.completedAt,
        })
        .from(sets)
        .innerJoin(sessions, eq(sets.sessionId, sessions.id))
        .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
        .where(
          and(eq(sessions.userId, userId), eq(sessions.status, "completed")),
        )
        .orderBy(desc(sets.completedAt))
        .limit(100),
    ]);
  const days = await Promise.all(
    (personal.length ? personal : standard).map(async (t) => ({
      name: t.name,
      exercises: await db
        .select({
          name: exercises.name,
          muscleGroup: exercises.muscleGroup,
          sets: templateExercises.sets,
          repMin: templateExercises.repMin,
          repMax: templateExercises.repMax,
        })
        .from(templateExercises)
        .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
        .where(eq(templateExercises.templateId, t.id))
        .orderBy(templateExercises.position),
    })),
  );
  return {
    profile: profile[0],
    scans,
    checkins,
    versions,
    history,
    currentPlan: { rationale: "Current training plan", days },
  };
}

export async function applyTraining(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  plan: TrainingPlan,
  baseVersion: string | null,
  snapshot: { profile?: unknown; scans?: unknown; checkins?: unknown },
) {
  await tx.insert(profiles).values({ userId }).onConflictDoNothing();
  await tx
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .for("update");
  const [latest] = await tx
    .select()
    .from(trainingVersions)
    .where(eq(trainingVersions.userId, userId))
    .orderBy(desc(trainingVersions.createdAt))
    .limit(1);
  if ((latest?.id ?? null) !== baseVersion)
    throw new Error(
      "Your plan changed. Reload and review the latest plan first.",
    );
  await tx
    .update(templates)
    .set({ active: false })
    .where(eq(templates.userId, userId));
  for (const [position, day] of plan.days.entries()) {
    const [template] = await tx
      .insert(templates)
      .values({ userId, name: day.name, position })
      .returning();
    for (const [position, e] of day.exercises.entries()) {
      const [exercise] = await tx
        .insert(exercises)
        .values({ name: e.name, muscleGroup: e.muscleGroup })
        .onConflictDoUpdate({ target: exercises.name, set: { name: e.name } })
        .returning();
      await tx.insert(templateExercises).values({
        templateId: template.id,
        exerciseId: exercise.id,
        position,
        sets: e.sets,
        repMin: e.repMin,
        repMax: e.repMax,
      });
    }
  }
  const [saved] = await tx
    .insert(trainingVersions)
    .values({
      userId,
      plan,
      context: {
        profile: snapshot.profile,
        scans: snapshot.scans,
        checkins: snapshot.checkins,
      },
    })
    .returning();
  return saved;
}
