import { NextResponse } from 'next/server';
export function fail(error: unknown) { const message = error instanceof Error ? error.message : 'Internal error'; return NextResponse.json({ error: message === 'UNAUTHORIZED' ? 'Sign in required' : message }, { status: message === 'UNAUTHORIZED' ? 401 : message === 'NOT_FOUND' ? 404 : 400 }); }
