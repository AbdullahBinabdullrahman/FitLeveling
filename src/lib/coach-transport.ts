import {
  AI_PROVIDERS,
  providerError,
  validateProviderKey,
  type AIProvider,
} from "./coach-provider";

export async function providerRequest(
  provider: AIProvider,
  path: "responses" | "models",
  apiKey: string,
  body?: unknown,
) {
  const key = apiKey.trim();
  validateProviderKey(provider, key);
  let response: Response;
  try {
    response = await fetch(`${AI_PROVIDERS[provider].baseUrl}/${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error(
      `${AI_PROVIDERS[provider].label} could not be reached. Try again or use the built-in coach.`,
    );
  }
  if (!response.ok) {
    // Do not return provider messages: some repeat credential fragments.
    const failure = (await response.json().catch(() => null)) as {
      error?: { code?: string };
    } | null;
    throw new Error(
      providerError(provider, response.status, failure?.error?.code),
    );
  }
  return response.json();
}
