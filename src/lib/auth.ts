import { SignJWT, jwtVerify } from 'jose';
import { cookies,headers } from 'next/headers';
import {verifyMobileSession} from './session-token';
const key = () => { const secret = process.env.SESSION_SECRET; if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters'); return new TextEncoder().encode(secret); };
export async function signSession(userId: string) { return new SignJWT({ sub: userId }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(key()); }
export async function currentUserId() { const authorization=(await headers()).get('authorization');if(authorization){if(!authorization.startsWith('Bearer '))return null;try{return await verifyMobileSession(authorization.slice(7));}catch{return null;}} const token = (await cookies()).get('levelup_session')?.value; if (!token) return null; try { const { payload } = await jwtVerify(token, key()); return payload.sub ?? null; } catch { return null; } }
export async function requireUser() { const id = await currentUserId(); if (!id) throw new Error('UNAUTHORIZED'); return id; }
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 30 };
