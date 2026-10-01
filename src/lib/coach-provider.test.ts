import { afterEach, describe, expect, it, vi } from "vitest";
import {
  filterCoachModels,
  normalizeCoachModel,
  providerError,
} from "./coach-provider";
import { providerRequest } from "./coach-transport";

afterEach(() => vi.restoreAllMocks());
describe("provider authentication and routing", () => {
  it("blocks a Groq key before any request can reach OpenAI", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    await expect(
      providerRequest("openai", "models", "gsk_test-only-key"),
    ).rejects.toThrow("Choose Groq");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("sends Groq discovery and chat to Groq without sending them to OpenAI", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({ data: [{ id: "openai/gpt-oss-120b" }] }),
            { status: 200 },
          ),
      );
    await providerRequest("groq", "models", "gsk_test-only-key");
    await providerRequest("groq", "responses", "gsk_test-only-key", {
      model: "openai/gpt-oss-120b",
      input: "Hello",
    });
    expect(fetch.mock.calls.map((c) => c[0])).toEqual([
      "https://api.groq.com/openai/v1/models",
      "https://api.groq.com/openai/v1/responses",
    ]);
  });
  it("keeps OpenAI calls on OpenAI and blocks an OpenAI key on Groq", async () => {
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await providerRequest("openai", "models", "sk-test-only-key");
    expect(fetch.mock.calls[0][0]).toBe("https://api.openai.com/v1/models");
    await expect(
      providerRequest("groq", "models", "sk-test-only-key"),
    ).rejects.toThrow("Choose OpenAI");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("never exposes credential text echoed in a provider error", async () => {
    const key = "gsk_test-only-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "invalid_api_key",
            message: `Rejected credential ${key}`,
          },
        }),
        { status: 401 },
      ),
    );
    await expect(providerRequest("groq", "models", key)).rejects.toThrow(
      "Groq rejected the API key",
    );
    try {
      await providerRequest("groq", "models", key);
    } catch (error) {
      expect(String(error)).not.toContain(key);
    }
  });
  it("distinguishes an IP allowlist failure from an invalid key", () => {
    expect(providerError("openai", 401, "ip_not_authorized")).toContain(
      "IP allowlist",
    );
    expect(providerError("groq", 403)).toContain("permission");
  });
});
describe("Groq model selection", () => {
  it("preserves provider namespaces and corrects the GPT OSS model ID from the reported connection", () => {
    expect(normalizeCoachModel("groq", "gpt-oss-120b")).toBe(
      "openai/gpt-oss-120b",
    );
    expect(normalizeCoachModel("groq", "openai/gpt-oss-120b")).toBe(
      "openai/gpt-oss-120b",
    );
    expect(normalizeCoachModel("groq", "qwen/qwen3.8-27b")).toBe(
      "qwen/qwen3.8-27b",
    );
    expect(normalizeCoachModel("openai", "gpt-4.1-mini")).toBe("gpt-4.1-mini");
  });
  it("lists active conversational Groq models without including audio or classifier models", () => {
    expect(
      filterCoachModels("groq", [
        { id: "openai/gpt-oss-120b", active: true },
        { id: "qwen/qwen3.8-27b", active: true },
        { id: "whisper-large-v3", active: true },
        { id: "canopylabs/orpheus-v1-english", active: true },
        { id: "meta-llama/llama-prompt-guard-2-22m", active: true },
        { id: "old-model", active: false },
      ]),
    ).toEqual(["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]);
  });
});
