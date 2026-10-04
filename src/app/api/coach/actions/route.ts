import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  coachMessages,
  profiles,
  targetVersions,
  nutrition,
  habits,
  hobbies,
  weights,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import {
  coachProposalSchema,
  assertFresh,
  assertUnchanged,
} from "@/lib/coach-actions";
import { applyTraining } from "@/lib/training-server";
export async function POST(r: NextRequest) {
  try {
    const u = await requireUser(),
      v = z
        .object({ id: z.uuid(), action: z.enum(["apply", "dismiss"]) })
        .parse(await r.json());
    await db.transaction(async (tx) => {
      await tx.insert(profiles).values({ userId: u }).onConflictDoNothing();
      const [p] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, u))
        .for("update");
      const [m] = await tx
        .select()
        .from(coachMessages)
        .where(
          and(
            eq(coachMessages.id, v.id),
            eq(coachMessages.userId, u),
            eq(coachMessages.role, "assistant"),
          ),
        )
        .for("update");
      if (!m) throw Error("NOT_FOUND");
      if (m.status === (v.action === "apply" ? "applied" : "dismissed")) return;
      if (v.action === "apply") assertFresh(m.status, m.createdAt);
      else if (m.status !== "pending")
        throw Error("This suggestion has already been handled");
      const a = coachProposalSchema.parse(m.proposal);
      if (v.action === "apply") {
        if (a.type === "training")
          await applyTraining(
            tx,
            u,
            a.plan,
            z.object({ version: z.uuid().nullable() }).parse(m.base).version,
            { profile: p },
          );
        if (a.type === "targets") {
          assertUnchanged(m.base, {
            calories: p.calorieTarget,
            proteinMin: p.proteinMin,
            proteinMax: p.proteinMax,
          });
          await tx
            .update(profiles)
            .set({
              calorieTarget: a.calories,
              proteinMin: a.proteinMin,
              proteinMax: a.proteinMax,
              targetMode: "coach",
            })
            .where(eq(profiles.userId, u));
          await tx
            .insert(targetVersions)
            .values({
              userId: u,
              calories: a.calories,
              proteinMin: a.proteinMin,
              proteinMax: a.proteinMax,
              method: "Reviewed coach suggestion",
              inputs: { messageId: m.id },
            });
        }
        if (a.type === "goal") {
          assertUnchanged(m.base, p.goal);
          await tx
            .update(profiles)
            .set({ goal: a.goal })
            .where(eq(profiles.userId, u));
        }
        if (a.type === "weight") {
          assertUnchanged(m.base, p.currentWeightKg);
          await tx
            .insert(weights)
            .values({ userId: u, weightKg: String(a.weightKg) });
          await tx
            .update(profiles)
            .set({ currentWeightKg: String(a.weightKg) })
            .where(eq(profiles.userId, u));
        }
        if (a.type === "hobbies") {
          const [h] = await tx
            .select()
            .from(hobbies)
            .where(eq(hobbies.userId, u));
          assertUnchanged(m.base, h?.tags ?? []);
          await tx
            .insert(hobbies)
            .values({ userId: u, tags: a.tags })
            .onConflictDoUpdate({
              target: hobbies.userId,
              set: { tags: a.tags },
            });
        }
        if (a.type === "habit") {
          const h = await tx
            .select()
            .from(habits)
            .where(and(eq(habits.userId, u), eq(habits.active, true)));
          if (h.length >= 12) throw Error("Maximum 12 active habits");
          if (h.some((h) => h.name.toLowerCase() === a.name.toLowerCase()))
            throw Error("This habit already exists");
          await tx.insert(habits).values({ userId: u, name: a.name });
        }
        if (a.type === "nutrition") {
          const [l] = await tx
            .select()
            .from(nutrition)
            .where(and(eq(nutrition.userId, u), eq(nutrition.day, a.day)))
            .for("update");
          assertUnchanged(
            m.base,
            l ? { calories: l.calories, proteinG: l.proteinG } : null,
          );
          await tx
            .insert(nutrition)
            .values({
              userId: u,
              day: a.day,
              calories: a.calories,
              proteinG: a.proteinG,
            })
            .onConflictDoUpdate({
              target: [nutrition.userId, nutrition.day],
              set: { calories: a.calories, proteinG: a.proteinG },
            });
        }
      }
      await tx
        .update(coachMessages)
        .set({ status: v.action === "apply" ? "applied" : "dismissed" })
        .where(eq(coachMessages.id, m.id));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
