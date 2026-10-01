import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import {
  coachApiKey,
  getCoachSettings,
  openaiRequest,
} from "@/lib/coach-server";
export async function GET() {
  try {
    const settings = await getCoachSettings(await requireUser());
    const result = (await openaiRequest("models", coachApiKey(settings))) as {
      data?: { id: string }[];
    };
    // Discovery reflects account access, not a hardcoded model catalogue.
    return NextResponse.json({
      models: (result.data ?? [])
        .map((m) => m.id)
        .filter(
          (id) =>
            /^(gpt-|o[1-9])/.test(id) &&
            !/audio|realtime|transcri|tts|image|search|codex/.test(id),
        )
        .sort(),
    });
  } catch (error) {
    return fail(error);
  }
}
