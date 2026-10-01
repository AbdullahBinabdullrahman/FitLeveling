export const AI_PROVIDERS = {
  openai: { label: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  groq: { label: "Groq", baseUrl: "https://api.groq.com/openai/v1" },
} as const;
export type AIProvider = keyof typeof AI_PROVIDERS;
export type CoachMode = "builtin" | AIProvider;
export function isAIProvider(value: string): value is AIProvider {
  return value === "openai" || value === "groq";
}
export function detectKeyProvider(key: string): string | null {
  if (key.startsWith("gsk_")) return "groq";
  if (key.startsWith("sk-or-")) return "OpenRouter";
  if (key.startsWith("sk-ant-")) return "Anthropic";
  if (key.startsWith("AIza")) return "Google Gemini";
  if (key.startsWith("sk-")) return "openai";
  return null;
}
export function validateProviderKey(provider: AIProvider, key: string) {
  const detected = detectKeyProvider(key);
  if (detected && detected !== provider) {
    const label = isAIProvider(detected)
      ? AI_PROVIDERS[detected].label
      : detected;
    throw new Error(
      `This key belongs to ${label}, but ${AI_PROVIDERS[provider].label} is selected. ${isAIProvider(detected) ? `Choose ${label} in Coach mode.` : `Use a key from ${AI_PROVIDERS[provider].label}.`}`,
    );
  }
}
export function normalizeCoachModel(provider: AIProvider, model: string) {
  const value = model.trim();
  return provider === "groq" && /^gpt-oss-(20b|120b)$/.test(value)
    ? `openai/${value}`
    : value;
}
export function filterCoachModels(
  provider: AIProvider,
  models: { id: string; active?: boolean }[],
) {
  return models
    .filter((m) => m.active !== false)
    .map((m) => m.id)
    .filter(
      (id) =>
        !/audio|realtime|transcri|tts|image|search|codex|whisper|orpheus|prompt-guard|safeguard|embedding/i.test(
          id,
        ) &&
        (provider === "groq" || /^(gpt-|o[1-9])/.test(id)),
    )
    .sort();
}
export function providerError(
  provider: AIProvider,
  status: number,
  code?: string,
) {
  const label = AI_PROVIDERS[provider].label;
  if (code === "ip_not_authorized")
    return `${label} blocked the server's IP address. Check the IP allowlist for your API project.`;
  if (status === 401)
    return `${label} rejected the API key. Use an active ${label} key and select ${label} in Coach mode.`;
  if (status === 403)
    return `This ${label} key does not have permission for the request. Check API project and model permissions.`;
  if (status === 429)
    return `${label} usage limit reached. Check your API quota or billing, or try again later.`;
  if (status === 400 || status === 404)
    return `${label} could not use this model. Load available models and choose a text model that supports the Responses API.`;
  return `${label} is unavailable. Try again or use the built-in coach.`;
}
