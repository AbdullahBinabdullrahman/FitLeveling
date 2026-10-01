import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { coachSettings } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { decryptApiKey, encryptApiKey } from "@/lib/coach";
import { isAIProvider, normalizeCoachModel } from "@/lib/coach-provider";
import {
  coachPublicSettings,
  getCoachSettings,
  defaultCoachModel,
  serverCoachKey,
  listCoachModels,
} from "@/lib/coach-server";

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
        provider: z.enum(["builtin", "openai", "groq"]),
        model: z
          .string()
          .trim()
          .max(120)
          .regex(/^[a-zA-Z0-9._:/-]*$/),
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
    let model = input.model;
    if (isAIProvider(input.provider)) {
      const key = encryptedApiKey
        ? decryptApiKey(encryptedApiKey)
        : serverCoachKey(input.provider);
      if (!key)
        throw new Error(
          `Add your ${input.provider === "groq" ? "Groq" : "OpenAI"} API key to connect`,
        );
      model = normalizeCoachModel(
        input.provider,
        model || defaultCoachModel(input.provider),
      );
      if (!model)
        throw new Error("Enter a model ID or choose one from your account");
      const available = await listCoachModels(input.provider, key);
      if (!available.includes(model))
        throw new Error(
          "This model is not available to your API key. Load available models and choose one from the list.",
        );
    }
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
