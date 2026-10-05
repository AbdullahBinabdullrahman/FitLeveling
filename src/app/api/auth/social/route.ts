import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users, profiles, authIdentities } from "@/db/schema";
import { socialServer } from "@/lib/social-auth";
import { cookieOptions, signSession } from "@/lib/auth";
import { signMobileSession } from "@/lib/session-token";
import { fail } from "@/lib/http";
export async function POST(r: NextRequest) {
  try {
    const v = z
      .object({
        accessToken: z.string().min(20).max(12000),
        mode: z.enum(["resolve", "create", "link"]).default("resolve"),
        platform: z.enum(["web", "mobile"]).default("web"),
        email: z.email().max(254).optional(),
        password: z.string().max(200).optional(),
        code: z.string().max(200).optional(),
      })
      .parse(await r.json());
    const { data, error } = await socialServer().auth.getUser(v.accessToken);
    const social = data.user;
    if (
      error ||
      !social ||
      !social.email ||
      !social.email_confirmed_at ||
      social.is_anonymous
    )
      throw Error("Social sign-in could not be verified");
    const email = z.email().parse(social.email.toLowerCase());
    const user = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${"social:" + social.id}))`,
      );
      const [identity] = await tx
        .select()
        .from(authIdentities)
        .where(eq(authIdentities.authUserId, social.id));
      if (identity) {
        const [u] = await tx
          .select()
          .from(users)
          .where(eq(users.id, identity.userId));
        return u;
      }
      if (v.mode === "resolve") return null;
      let u;
      if (v.mode === "link") {
        if (!v.email || !v.password)
          throw Error("Enter your existing account email and password");
        [u] = await tx
          .select()
          .from(users)
          .where(eq(users.email, v.email.toLowerCase()));
        if (
          !u ||
          !u.hasPassword ||
          !(await compare(v.password, u.passwordHash))
        )
          throw Error("The existing account credentials did not match");
      } else {
        if (
          !process.env.REGISTRATION_CODE ||
          v.code !== process.env.REGISTRATION_CODE
        )
          throw Error("Invalid registration code");
        const [existing] = await tx
          .select()
          .from(users)
          .where(eq(users.email, email));
        if (existing)
          throw Error(
            "An account with this email already exists. Choose Link existing account.",
          );
        const name =
          String(
            social.user_metadata.full_name ??
              social.user_metadata.name ??
              "Explorer",
          )
            .trim()
            .slice(0, 80) || "Explorer";
        [u] = await tx
          .insert(users)
          .values({
            email,
            name,
            passwordHash: await hash(randomBytes(32).toString("hex"), 12),
            hasPassword: false,
          })
          .returning();
        await tx.insert(profiles).values({ userId: u.id });
      }
      await tx
        .insert(authIdentities)
        .values({ authUserId: social.id, userId: u.id });
      return u;
    });
    if (!user) return NextResponse.json({ needsOnboarding: true });
    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      ...(v.platform === "mobile"
        ? { token: await signMobileSession(user.id) }
        : {}),
    });
    if (v.platform === "web")
      response.cookies.set(
        "levelup_session",
        await signSession(user.id),
        cookieOptions,
      );
    return response;
  } catch (e) {
    return fail(e);
  }
}
