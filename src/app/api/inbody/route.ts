import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { inbodyScans } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { fail } from '@/lib/http';
const schema = z.object({ measuredAt: z.iso.date(), weightKg: z.number().min(25).max(400), bodyFatPercent: z.number().min(1).max(75).optional(), skeletalMuscleKg: z.number().min(1).max(200).optional(), fatMassKg: z.number().min(0).max(300).optional(), measuredBmr: z.number().int().min(500).max(6000).optional() });
export async function GET() { try { const id = await requireUser(); return NextResponse.json({ scans: await db.select().from(inbodyScans).where(eq(inbodyScans.userId, id)).orderBy(desc(inbodyScans.measuredAt)) }); } catch (e) { return fail(e); } }
export async function POST(request: NextRequest) { try { const id = await requireUser(); const v = schema.parse(await request.json()); const [scan] = await db.insert(inbodyScans).values({ userId: id, measuredAt: v.measuredAt, weightKg: String(v.weightKg), bodyFatPercent: v.bodyFatPercent?.toString(), skeletalMuscleKg: v.skeletalMuscleKg?.toString(), fatMassKg: v.fatMassKg?.toString(), measuredBmr: v.measuredBmr }).returning(); return NextResponse.json({ scan }); } catch (e) { return fail(e); } }
