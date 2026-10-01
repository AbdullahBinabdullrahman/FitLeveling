import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coachSettings } from "@/db/schema";
import { decryptApiKey } from "./coach";

export async function getCoachSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(coachSettings)
    .where(eq(coachSettings.userId, userId));
  return settings;
}
export function coachPublicSettings(
  settings: Awaited<ReturnType<typeof getCoachSettings>>,
) {
  return {
    provider: settings?.provider ?? "builtin",
    model: settings?.model ?? "",
    hasPersonalKey: Boolean(settings?.encryptedApiKey),
    hasServerKey: Boolean(process.env.OPENAI_API_KEY),
    defaultModel: process.env.OPENAI_MODEL ?? "",
  };
}
export function coachApiKey(
  settings: Awaited<ReturnType<typeof getCoachSettings>>,
) {
  const key = settings?.encryptedApiKey
    ? decryptApiKey(settings.encryptedApiKey)
    : process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Add an OpenAI API key in coach settings first");
  return key;
}
export async function openaiRequest(
  path: "responses" | "models",
  apiKey: string,
  body?: unknown,
) {
  let response: Response;
  try {
    response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error(
      "The AI service took too long to respond. Try again or switch to the built-in coach.",
    );
  }
  if (!response.ok) {
    if (response.status === 401)
      throw new Error(
        "The AI API key was rejected. Check your key in coach settings.",
      );
    if (response.status === 429)
      throw new Error(
        "AI usage limit reached. Check your API billing or try again later.",
      );
    if (response.status === 400 || response.status === 404)
      throw new Error(
        "This model could not handle the request. Choose a text model that supports the Responses API.",
      );
    throw new Error(
      "The AI provider is unavailable. Try again or use the built-in coach.",
    );
  }
  return response.json();
}
