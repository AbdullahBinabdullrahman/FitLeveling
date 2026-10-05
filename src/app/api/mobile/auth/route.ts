import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users, profiles } from "@/db/schema";
import { signMobileSession } from "@/lib/session-token";
import { fail } from "@/lib/http";
export async function POST(r: NextRequest) {
  try {
    const v = z
      .object({
        email: z
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        password: z
          .string()
          .min(10)
          .max(200)
          .refine(
            (v) => Buffer.byteLength(v, "utf8") <= 72,
            "Password must be at most 72 bytes",
          ),
        name: z.string().trim().min(2).max(80).optional(),
        code: z.string().max(200).optional(),
      })
      .parse(await r.json());
    let user;
    if (v.name) {
      if (
        !process.env.REGISTRATION_CODE ||
        v.code !== process.env.REGISTRATION_CODE
      )
        throw Error("Invalid registration code");
      user = await db.transaction(async (tx) => {
        const [u] = await tx
          .insert(users)
          .values({
            email: v.email,
            name: v.name!,
            passwordHash: await hash(v.password, 12),
          })
          .returning();
        await tx.insert(profiles).values({ userId: u.id });
        return u;
      });
    } else {
      [user] = await db.select().from(users).where(eq(users.email, v.email));
      if (
        !user ||
        !user.hasPassword ||
        !(await compare(v.password, user.passwordHash))
      )
        throw Error("Invalid credentials");
    }
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: await signMobileSession(user.id),
    });
  } catch (e) {
    return fail(e);
  }
}
