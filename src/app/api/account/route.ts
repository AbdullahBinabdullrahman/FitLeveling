import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { accountSchema } from "@/lib/account";
export async function GET() {
  try {
    const u = await requireUser();
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        timezone: profiles.timezone,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, u));
    if (!user) throw Error("NOT_FOUND");
    return NextResponse.json({ user });
  } catch (e) {
    return fail(e);
  }
}
export async function PATCH(r: NextRequest) {
  try {
    const u = await requireUser(),
      v = accountSchema.parse(await r.json());
    const user = await db.transaction(async (tx) => {
      const [old] = await tx
        .select()
        .from(users)
        .where(eq(users.id, u))
        .for("update");
      if (!old) throw Error("NOT_FOUND");
      if (v.email !== old.email || v.newPassword) {
        if (
          !v.currentPassword ||
          !(await compare(v.currentPassword, old.passwordHash))
        )
          throw Error(
            "Enter your current password to change your email or password",
          );
      }
      const [saved] = await tx
        .update(users)
        .set({
          name: v.name,
          email: v.email,
          ...(v.newPassword
            ? { passwordHash: await hash(v.newPassword, 12) }
            : {}),
        })
        .where(eq(users.id, u))
        .returning({ id: users.id, name: users.name, email: users.email });
      await tx
        .insert(profiles)
        .values({ userId: u, timezone: v.timezone })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: { timezone: v.timezone },
        });
      return { ...saved, timezone: v.timezone };
    });
    return NextResponse.json({ user });
  } catch (e) {
    if (
      (e as { cause?: { code?: string }; code?: string }).cause?.code ===
        "23505" ||
      (e as { code?: string }).code === "23505"
    )
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 },
      );
    return fail(e);
  }
}
