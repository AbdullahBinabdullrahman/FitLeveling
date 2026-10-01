import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { coachSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { encryptApiKey } from "@/lib/coach";
import { coachPublicSettings, getCoachSettings } from "@/lib/coach-server";

export async function GET() {
  try {
    return NextResponse.json(
      coachPublicSettings(await getCoachSettings(await requireUser())),
    );
  } catch (error) {
    return fail(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUser();
    const input = z
      .object({
        provider: z.enum(["builtin", "openai"]),
        model: z
          .string()
          .trim()
          .max(120)
          .regex(/^[a-zA-Z0-9._:-]*$/),
        apiKey: z.string().trim().min(10).max(512).optional(),
        removeKey: z.boolean().optional(),
      })
      .parse(await request.json());
    const existing = await getCoachSettings(userId);
    const encryptedApiKey = input.removeKey
      ? null
      : input.apiKey
        ? encryptApiKey(input.apiKey)
        : (existing?.encryptedApiKey ?? null);
    if (
      input.provider === "openai" &&
      !encryptedApiKey &&
      !process.env.OPENAI_API_KEY
    )
      throw new Error("Add your API key to connect OpenAI");
    const model = input.model || process.env.OPENAI_MODEL || "";
    if (input.provider === "openai" && !model)
      throw new Error("Enter a model ID or choose one from your account");
    const values = { provider: input.provider, model, encryptedApiKey };
    await db
      .insert(coachSettings)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: coachSettings.userId, set: values });
    return NextResponse.json(
      coachPublicSettings(await getCoachSettings(userId)),
    );
  } catch (error) {
    return fail(error);
  }
}
