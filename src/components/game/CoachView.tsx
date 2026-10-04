"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  KeyRound,
  Send,
  Settings2,
  Sparkles,
} from "lucide-react";
import {
  AI_PROVIDERS,
  isAIProvider,
  normalizeCoachModel,
  type CoachMode,
  type AIProvider,
} from "@/lib/coach-provider";
import type { GameData } from "@/lib/game";
import Character from "./Character";
import CoachProposalCard from "./CoachProposalCard";
import type { CoachProposal } from "@/lib/coach-actions";
import TrainingWorkspace from "./TrainingWorkspace";

type Settings = {
  provider: CoachMode;
  model: string;
  hasPersonalKey: boolean;
  hasServerKey: boolean;
  defaultModel: string;
  serverKeys: Record<AIProvider, boolean>;
  defaultModels: Record<AIProvider, string>;
  suggestedProvider: AIProvider | null;
  keyNeedsReconnect: boolean;
};
type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  proposal?: CoachProposal | null;
  status?: string;
};
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/coach${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Your coach could not connect");
  return data;
}
export default function CoachView({
  game,
  onPlanApplied,
}: {
  game: GameData;
  onPlanApplied: () => Promise<void>;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [provider, setProvider] = useState<CoachMode>("builtin");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showTraining, setShowTraining] = useState(false);
  const [applying, setApplying] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const retry = useRef<{ text: string; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const acceptSettings = (next: Settings) => {
    setSettings(next);
    const selected =
      isAIProvider(next.provider) && next.suggestedProvider
        ? next.suggestedProvider
        : next.provider;
    setProvider(selected);
    setModel(
      isAIProvider(selected)
        ? normalizeCoachModel(
            selected,
            next.model || next.defaultModels[selected],
          )
        : next.model,
    );
    if (selected !== next.provider)
      setNotice(
        `Your saved key belongs to ${AI_PROVIDERS[selected as AIProvider].label}. Load models and save to correct the provider.`,
      );
  };
  async function loadChat() {
    const d = await request<{ messages: Message[] }>("");
    setMessages(d.messages);
  }
  useEffect(() => {
    let active = true;
    request<{ messages: Message[] }>("")
      .then((d) => {
        if (active) setMessages(d.messages);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoadingChat(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function applySuggestion(id: string, action: "apply" | "dismiss") {
    if (applying || thinking) return;
    setApplying(id);
    setError("");
    try {
      await request("/actions", "POST", { id, action });
      setMessages((m) =>
        m.map((v) =>
          v.id === id
            ? { ...v, status: action === "apply" ? "applied" : "dismissed" }
            : v,
        ),
      );
      if (action === "apply") {
        setNotice("Change saved. Your plan and progress are updated.");
        try {
          await onPlanApplied();
        } catch {
          setNotice(
            "Change saved. Refresh to see your updated plan and progress.",
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setApplying(null);
    }
  }
  useEffect(() => {
    request<Settings>("/settings")
      .then(acceptSettings)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({
      behavior: game.character.animations ? "smooth" : "instant",
      block: "nearest",
    });
  }, [messages, thinking, game.character.animations]);
  async function send(message: string) {
    const text = message.trim();
    if (!text || thinking || applying || loadingChat || !settings) return;
    setError("");
    setThinking(true);
    setInput("");
    const clientId =
      retry.current?.text === text ? retry.current.id : crypto.randomUUID();
    retry.current = { text, id: clientId };
    setMessages((previous) =>
      previous.at(-1)?.role === "user" && previous.at(-1)?.content === text
        ? previous
        : [...previous, { role: "user", content: text }],
    );
    try {
      const result = await request<Message>("", "POST", {
        message: text,
        clientId,
      });
      setMessages((previous) => [...previous, result]);
      retry.current = null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
      setInput(text);
    } finally {
      setThinking(false);
    }
  }
  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const next = await request<Settings>("/settings", "PATCH", {
        provider,
        model,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      acceptSettings(next);
      setApiKey("");
      setNotice(
        next.provider === "builtin"
          ? "Built-in coach is ready."
          : "AI coach connected.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }
  async function discover() {
    if (!isAIProvider(provider)) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const next = await request<{ models: string[] }>("/models", "POST", {
        provider,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      setModels(next.models);
      if (model) setModel(normalizeCoachModel(provider, model));
      setNotice(
        next.models.length
          ? "Key verified. Choose a model, then save to connect."
          : "No supported text models found for this account.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not discover models");
    } finally {
      setSaving(false);
    }
  }
  const selectedProvider = isAIProvider(provider) ? provider : "openai";
  const providerLabel = AI_PROVIDERS[selectedProvider].label;
  const hasServerKey = settings?.serverKeys[selectedProvider] ?? false;
  const activeProvider =
    settings && isAIProvider(settings.provider) ? settings.provider : null;
  const connected = Boolean(activeProvider);
  return (
    <div className="screen-enter">
      <div className="section-heading">
        <div>
          <div className="label text-violet-300">
            A companion in your corner
          </div>
          <h2>Let’s work on your next step</h2>
          <p className="muted">
            Talk it through, review a suggestion, and save what works for you.
          </p>
        </div>
        <button
          className="ghost flex items-center gap-2"
          aria-expanded={showSettings}
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings2 size={16} /> AI settings <ChevronDown size={14} />
        </button>
      </div>

      {showSettings && (
        <section className="card mb-5 space-y-4">
          <div className="flex items-center gap-2 font-bold">
            <KeyRound size={18} className="text-violet-300" /> Connect your AI
            model
          </div>
          <p className="muted text-sm">
            Use the built-in coach, or connect OpenAI or Groq for conversational
            coaching. Your selected provider receives your chat, profile, recent
            InBody scans, daily updates, current training plan and game
            progress. API usage is billed to the connected key.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="field">
              Coach mode
              <select
                value={provider}
                disabled={saving || thinking}
                onChange={(e) => {
                  const selected = e.target.value as CoachMode;
                  setProvider(selected);
                  setModels([]);
                  setNotice("");
                  setModel(
                    settings?.provider === selected
                      ? settings.model
                      : isAIProvider(selected)
                        ? (settings?.defaultModels[selected] ?? "")
                        : "",
                  );
                }}
              >
                <option value="builtin">
                  Built-in companion · No API key needed
                </option>
                <option value="openai">OpenAI · Your choice of model</option>
                <option value="groq">
                  Groq · GPT OSS and other text models
                </option>
              </select>
            </label>
            {isAIProvider(provider) && (
              <label className="field">
                Model ID
                <input
                  list="coach-models"
                  value={model}
                  maxLength={120}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Load models or enter a model ID"
                />
                <datalist id="coach-models">
                  {models.map((id) => (
                    <option key={id} value={id} />
                  ))}
                </datalist>
              </label>
            )}
          </div>
          {isAIProvider(provider) && (
            <>
              <label className="field">
                {providerLabel} API key
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  maxLength={512}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    settings?.hasPersonalKey
                      ? "Personal key saved · Enter to replace"
                      : hasServerKey
                        ? "Server key available · Personal key optional"
                        : "Paste your API key"
                  }
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="ghost btn-small"
                  disabled={
                    saving ||
                    thinking ||
                    (!apiKey.trim() &&
                      !settings?.hasPersonalKey &&
                      !hasServerKey)
                  }
                  onClick={discover}
                >
                  {saving ? "Connecting…" : "Load available models"}
                </button>
                <span className="muted text-xs">
                  Keys are encrypted; the browser never receives a saved key.
                </span>
              </div>
              <p className="muted text-xs">
                Choose a text model that supports the Responses API. Model
                availability comes from your account.
              </p>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className="btn"
              disabled={saving || thinking}
              onClick={save}
            >
              {saving ? "Saving…" : "Save coach settings"}
            </button>
            {settings?.hasPersonalKey && (
              <button
                className="ghost"
                disabled={saving || thinking}
                onClick={async () => {
                  setSaving(true);
                  setError("");
                  try {
                    acceptSettings(
                      await request<Settings>("/settings", "PATCH", {
                        provider: "builtin",
                        model: "",
                        removeKey: true,
                      }),
                    );
                    setApiKey("");
                    setNotice(
                      "Personal key removed. Built-in coach is active.",
                    );
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Could not remove key",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                Remove personal key
              </button>
            )}
          </div>
          {settings?.keyNeedsReconnect && (
            <p role="status" className="text-sm text-amber-200">
              Reconnect your API key; the saved key cannot be decrypted after a
              server configuration change.
            </p>
          )}
          {notice && (
            <p role="status" className="text-sm text-teal-300">
              {notice}
            </p>
          )}
        </section>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="mb-4 text-teal-300">
          {notice}
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_.6fr]">
        <aside className="card coach-companion order-2">
          <div className="label">{game.character.name}’s command center</div>
          <Character
            character={game.character}
            level={game.stats.level}
            compact
            interactive={false}
          />
          <h3 className="text-xl font-bold">You set the pace.</h3>
          <p className="muted mt-2 text-sm">
            Your AI coach can read your saved goal, recent scans, daily updates,
            training plan and progress. Your rest days count as taking care of
            yourself.
          </p>
          <div className="mt-5 space-y-2">
            <div className="context-row">
              <span>Training this week</span>
              <b>
                {game.stats.weeklyWorkouts} session
                {game.stats.weeklyWorkouts === 1 ? "" : "s"}
              </b>
            </div>
            <div className="context-row">
              <span>Companion level</span>
              <b>{game.stats.level}</b>
            </div>
            <div className="context-row">
              <span>Fuel check-ins</span>
              <b>
                {game.stats.nutritionDays} day
                {game.stats.nutritionDays === 1 ? "" : "s"}
              </b>
            </div>
          </div>
          <div className="coach-mode">
            <span className={`status-dot ${connected ? "ai" : ""}`} />
            {connected
              ? `${AI_PROVIDERS[activeProvider!].label} · ${settings?.model}`
              : "Built-in companion"}
          </div>
        </aside>
        <section className="chat-card order-1 coach-chat-primary">
          <div className="chat-header">
            <span className="flex items-center gap-2 font-bold">
              <Bot size={19} className="text-violet-300" /> Your coach
            </span>
            <button
              className="muted text-xs"
              disabled={thinking || applying !== null || loadingChat}
              onClick={() => {
                loadChat().catch((e) => setError(e.message));
                setInput("");
                retry.current = null;
                setError("");
              }}
            >
              Reload conversation
            </button>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-label="Coach conversation"
            aria-live="polite"
          >
            {!loadingChat && messages.length === 0 && (
              <div className="chat-welcome">
                <span className="chat-welcome-icon">
                  <Sparkles size={25} />
                </span>
                <h3 className="mt-4 text-2xl font-bold">
                  What’s on your mind?
                </h3>
                <p className="muted mt-3 text-sm">
                  Tell me what changed, what you want to try, or what’s getting
                  in your way. We can work on your training, nutrition and daily
                  routine together.
                </p>
                <div className="suggestions">
                  {[
                    "Can we adjust my exercises?",
                    "Let’s review my nutrition targets",
                    "I’m tired. Should I rest?",
                    "Help me build a daily habit",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      disabled={
                        thinking ||
                        applying !== null ||
                        loadingChat ||
                        !settings
                      }
                      onClick={() => send(prompt)}
                    >
                      {prompt} <Send size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div className={`chat-message ${m.role}`} key={i}>
                {m.role === "assistant" && (
                  <span className="chat-author">
                    <Sparkles size={12} />{" "}
                    {connected ? "AI coach" : "Companion"}
                  </span>
                )}
                <p>{m.content}</p>
                {m.proposal && m.id && (
                  <CoachProposalCard
                    proposal={m.proposal}
                    status={m.status ?? "pending"}
                    busy={!!applying || thinking}
                    onAction={(action) => applySuggestion(m.id!, action)}
                  />
                )}
              </div>
            ))}
            {loadingChat && (
              <p role="status" className="muted">
                Loading your conversation…
              </p>
            )}
            {thinking && (
              <div className="chat-message assistant">
                <span
                  className="thinking-dots"
                  role="status"
                  aria-label="Coach is thinking"
                >
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            <div ref={bottom} />
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="coach-message" className="sr-only">
              Message your coach
            </label>
            <textarea
              rows={2}
              id="coach-message"
              value={input}
              maxLength={1500}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you’d like to work on…"
              disabled={
                thinking || applying !== null || loadingChat || !settings
              }
            />
            <button
              className="btn"
              disabled={
                thinking ||
                applying !== null ||
                loadingChat ||
                !settings ||
                !input.trim()
              }
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </form>
          {!connected && (
            <button
              type="button"
              className="ghost m-3"
              onClick={() => setShowSettings(true)}
            >
              Connect AI for open-ended chat & plan changes
            </button>
          )}
          <p className="chat-footnote">
            {connected
              ? "AI suggestions may be imperfect. You decide what fits your day."
              : "Built-in guidance uses your progress and preset responses. Connect an AI model for open-ended chat."}
          </p>
        </section>
      </div>
      <section className="card mt-5">
        <button
          className="ghost"
          aria-expanded={showTraining}
          onClick={() => setShowTraining(!showTraining)}
        >
          {showTraining ? "Hide" : "Open"} daily check-in & manual plan editor
        </button>
        <p className="muted text-sm mt-2">
          Prefer to edit yourself? Keep your daily recovery notes and plan here.
        </p>
        {showTraining && <TrainingWorkspace onPlanApplied={onPlanApplied} />}
      </section>
    </div>
  );
}
