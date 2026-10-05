import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notificationDevices } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
export async function POST(r: NextRequest) {
  try {
    const userId = await requireUser();
    const v = z
      .object({
        installationId: z.uuid(),
        token: z
          .string()
          .max(300)
          .regex(/^(ExpoPushToken|ExponentPushToken)\[[A-Za-z0-9_-]+\]$/),
        social: z.boolean(),
      })
      .parse(await r.json());
    await db
      .insert(notificationDevices)
      .values({ userId, ...v })
      .onConflictDoUpdate({
        target: notificationDevices.installationId,
        set: {
          userId,
          token: v.token,
          social: v.social,
          updatedAt: new Date(),
        },
      });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
export async function DELETE(r: NextRequest) {
  try {
    const userId = await requireUser(),
      installationId = z
        .uuid()
        .parse(r.nextUrl.searchParams.get("installationId"));
    await db
      .delete(notificationDevices)
      .where(
        and(
          eq(notificationDevices.userId, userId),
          eq(notificationDevices.installationId, installationId),
        ),
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
