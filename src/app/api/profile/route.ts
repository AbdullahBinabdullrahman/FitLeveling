import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { profiles, targetVersions } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { estimateTargets } from '@/lib/domain';
import { fail } from '@/lib/http';
const schema = z.object({ heightCm: z.number().min(100).max(250), currentWeightKg: z.number().min(25).max(400), birthYear: z.number().int().min(1920).max(new Date().getFullYear() - 18), sexForEstimate: z.enum(['male','female']), activityFactor: z.number().min(1.2).max(1.9), goal: z.enum(['lose','maintain','gain']), applyTargets: z.boolean().default(false) });
export async function GET() { try { const id = await requireUser(); const [profile] = await db.select().from(profiles).where(eq(profiles.userId, id)); return NextResponse.json({ profile }); } catch (e) { return fail(e); } }
export async function PATCH(request: NextRequest) { try { const id = await requireUser(); const value = schema.parse(await request.json()); const targets = estimateTargets({ weightKg: value.currentWeightKg, heightCm: value.heightCm, age: new Date().getFullYear() - value.birthYear, sex: value.sexForEstimate, activityFactor: value.activityFactor, goal: value.goal }); await db.transaction(async tx => { await tx.update(profiles).set({ heightCm: String(value.heightCm), currentWeightKg: String(value.currentWeightKg), birthYear: value.birthYear, sexForEstimate: value.sexForEstimate, activityFactor: String(value.activityFactor), goal: value.goal, ...(value.applyTargets ? { calorieTarget: targets.calories, proteinMin: targets.proteinMin, proteinMax: targets.proteinMax, targetMode: 'auto' } : {}) }).where(eq(profiles.userId, id)); if (value.applyTargets) await tx.insert(targetVersions).values({ userId: id, calories: targets.calories, proteinMin: targets.proteinMin, proteinMax: targets.proteinMax, method: targets.method, inputs: value }); }); return NextResponse.json({ proposal: targets, applied: value.applyTargets }); } catch (e) { return fail(e); } }
