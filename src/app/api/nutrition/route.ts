import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { nutrition } from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { fail } from '@/lib/http';
export async function GET() { try { const id = await requireUser(); return NextResponse.json({ logs: await db.select().from(nutrition).where(eq(nutrition.userId, id)).orderBy(desc(nutrition.day)).limit(30) }); } catch (e) { return fail(e); } }
export async function POST(request: NextRequest) { try { const id = await requireUser(); const v = z.object({ day: z.iso.date(), calories: z.number().int().min(0).max(10000), proteinG: z.number().int().min(0).max(500) }).parse(await request.json()); await db.insert(nutrition).values({ userId: id, ...v }).onConflictDoUpdate({ target: [nutrition.userId, nutrition.day], set: { calories: sql`excluded.calories`, proteinG: sql`excluded.protein_g` } }); return NextResponse.json({ ok: true }); } catch (e) { return fail(e); } }
