import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { weights, profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
export async function GET() {
  try {
    const id = await requireUser();
    return NextResponse.json({
      weights: await db
        .select()
        .from(weights)
        .where(eq(weights.userId, id))
        .orderBy(desc(weights.measuredAt))
        .limit(90),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const id = await requireUser();
    const { weightKg } = z
      .object({ weightKg: z.number().min(25).max(400) })
      .parse(await request.json());
    const item = await db.transaction(async (tx) => {
      await tx.insert(profiles).values({ userId: id }).onConflictDoNothing();
      await tx
        .update(profiles)
        .set({ currentWeightKg: String(weightKg) })
        .where(eq(profiles.userId, id));
      const [saved] = await tx
        .insert(weights)
        .values({ userId: id, weightKg: String(weightKg) })
        .returning();
      return saved;
    });
    return NextResponse.json({ item });
  } catch (e) {
    return fail(e);
  }
}
