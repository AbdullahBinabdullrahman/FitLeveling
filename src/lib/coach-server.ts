import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coachSettings } from "@/db/schema";
import { decryptApiKey } from "./coach";
import {
  detectKeyProvider,
  filterCoachModels,
  isAIProvider,
  type AIProvider,
} from "./coach-provider";
import { providerRequest } from "./coach-transport";
export { providerRequest } from "./coach-transport";

export async function getCoachSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(coachSettings)
    .where(eq(coachSettings.userId, userId));
  return settings;
}
export function defaultCoachModel(provider: AIProvider) {
  return (
    (provider === "groq" ? process.env.GROQ_MODEL : process.env.OPENAI_MODEL) ??
    ""
  );
}
export function serverCoachKey(provider: AIProvider) {
  return provider === "groq"
    ? process.env.GROQ_API_KEY
    : process.env.OPENAI_API_KEY;
}
export function coachPublicSettings(
  settings: Awaited<ReturnType<typeof getCoachSettings>>,
) {
  const provider = settings?.provider ?? "builtin";
  const selected = isAIProvider(provider) ? provider : "openai";
  let detected: string | null = null;
  let keyNeedsReconnect = false;
  try {
    if (settings?.encryptedApiKey)
      detected = detectKeyProvider(decryptApiKey(settings.encryptedApiKey));
  } catch {
    keyNeedsReconnect = true;
  }
  return {
    provider,
    model: settings?.model ?? "",
    hasPersonalKey: Boolean(settings?.encryptedApiKey),
    hasServerKey: Boolean(serverCoachKey(selected)),
    defaultModel: defaultCoachModel(selected),
    serverKeys: {
      openai: Boolean(serverCoachKey("openai")),
      groq: Boolean(serverCoachKey("groq")),
    },
    defaultModels: {
      openai: defaultCoachModel("openai"),
      groq: defaultCoachModel("groq"),
    },
    keyNeedsReconnect,
    suggestedProvider: detected && isAIProvider(detected) ? detected : null,
  };
}
export function coachApiKey(
  settings: Awaited<ReturnType<typeof getCoachSettings>>,
  provider?: AIProvider,
) {
  const selected =
    provider ??
    (settings && isAIProvider(settings.provider)
      ? settings.provider
      : "openai");
  const key = settings?.encryptedApiKey
    ? decryptApiKey(settings.encryptedApiKey)
    : serverCoachKey(selected);
  if (!key)
    throw new Error(
      `Add a ${selected === "groq" ? "Groq" : "OpenAI"} API key in coach settings first`,
    );
  return key.trim();
}
export async function listCoachModels(provider: AIProvider, apiKey: string) {
  const result = (await providerRequest(provider, "models", apiKey)) as {
    data?: { id: string; active?: boolean }[];
  };
  return filterCoachModels(provider, result.data ?? []);
}
