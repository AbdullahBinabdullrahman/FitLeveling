import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, profiles } from '@/db/schema';
import { cookieOptions, signSession, currentUserId } from '@/lib/auth';
import { fail } from '@/lib/http';
const input = z.object({ email: z.email(), password: z.string().min(10), name: z.string().min(2).optional(), code: z.string().optional() });
export async function GET() { const id = await currentUserId(); if (!id) return NextResponse.json({ user: null }); const [user] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, id)); return NextResponse.json({ user: user ?? null }); }
export async function POST(request: NextRequest) { try { const body = input.parse(await request.json()); if (body.name && (!process.env.REGISTRATION_CODE || body.code !== process.env.REGISTRATION_CODE)) throw new Error('Invalid registration code'); let user; if (body.name) { const passwordHash=await hash(body.password,12); user=await db.transaction(async tx=>{ const [created]=await tx.insert(users).values({name:body.name!,email:body.email.toLowerCase(),passwordHash}).returning();await tx.insert(profiles).values({userId:created.id});return created; }); } else { [user] = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())); if (!user || !user.hasPassword || !(await compare(body.password, user.passwordHash))) throw new Error('Invalid credentials'); } const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }); response.cookies.set('levelup_session', await signSession(user.id), cookieOptions); return response; } catch (e) { return fail(e); } }
export async function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set('levelup_session', '', { ...cookieOptions, maxAge: 0 }); return response; }
