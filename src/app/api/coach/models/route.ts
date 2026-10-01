import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import {
  coachApiKey,
  getCoachSettings,
  listCoachModels,
} from "@/lib/coach-server";
import { type AIProvider } from "@/lib/coach-provider";

export async function GET(request: NextRequest) {
  try {
    const settings = await getCoachSettings(await requireUser());
    const selected =
      request.nextUrl.searchParams.get("provider") ??
      settings?.provider ??
      "openai";
    const provider: AIProvider =
      selected === "builtin"
        ? "openai"
        : z.enum(["openai", "groq"]).parse(selected);
    return NextResponse.json({
      provider,
      models: await listCoachModels(provider, coachApiKey(settings, provider)),
    });
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    const input = z
      .object({
        provider: z.enum(["openai", "groq"]),
        apiKey: z.string().trim().min(10).max(512).optional(),
      })
      .parse(await request.json());
    const settings = await getCoachSettings(userId);
    const key = input.apiKey ?? coachApiKey(settings, input.provider);
    // Test a draft key without replacing a working saved credential.
    return NextResponse.json({
      provider: input.provider,
      models: await listCoachModels(input.provider, key),
    });
  } catch (error) {
    return fail(error);
  }
}
