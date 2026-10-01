"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  Coins,
  LockKeyhole,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import Character from "./Character";
import {
  ACCESSORIES,
  ARCHETYPES,
  COLORS,
  type Character as CharacterData,
  type GameData,
  type Quest,
  type CelebrationData,
} from "@/lib/game";

export function RewardLabel({ xp, coins }: { xp: number; coins: number }) {
  return (
    <span className="reward-label">
      <span>
        <Zap size={13} /> +{xp} XP
      </span>
      <span>
        <Coins size={13} /> +{coins}
      </span>
    </span>
  );
}
export function QuestCard({
  quest,
  onClaim,
  pending,
}: {
  quest: Quest;
  onClaim: (q: Quest) => void;
  pending: boolean;
}) {
  const ready = quest.current >= quest.target;
  return (
    <article
      className={`quest-card ${quest.claimed ? "quest-claimed" : ready ? "quest-ready" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="quest-icon">
          {quest.claimed ? (
            <CheckCheck size={20} />
          ) : quest.kind === "achievement" ? (
            <Trophy size={20} />
          ) : (
            <Zap size={20} />
          )}
        </span>
        <span className="label">
          {quest.kind === "achievement"
            ? "Milestone"
            : quest.kind === "daily"
              ? "Daily quest"
              : "Weekly quest"}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold">{quest.title}</h3>
      <p className="muted mt-1 min-h-10 text-sm">{quest.description}</p>
      <div className="my-4">
        <div className="mb-2 flex justify-between text-xs">
          <span className="muted">
            {quest.claimed
              ? "Reward collected"
              : ready
                ? "Ready to collect"
                : "In progress"}
          </span>
          <span>
            {quest.current} / {quest.target}
          </span>
        </div>
        <div className="game-progress">
          <div style={{ width: `${(quest.current / quest.target) * 100}%` }} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RewardLabel xp={quest.xp} coins={quest.coins} />
        <button
          className={
            ready && !quest.claimed ? "btn btn-small" : "ghost btn-small"
          }
          disabled={!ready || quest.claimed || pending}
          onClick={() => onClaim(quest)}
        >
          {quest.claimed ? (
            <>
              <Check size={14} /> Collected
            </>
          ) : pending ? (
            "Claiming…"
          ) : ready ? (
            "Claim reward"
          ) : (
            <>
              <LockKeyhole size={13} /> Locked
            </>
          )}
        </button>
      </div>
    </article>
  );
}
export function BossRaid({
  quest,
  onClaim,
  pending = false,
  onTrain,
}: {
  quest: Quest;
  onClaim: (q: Quest) => void;
  pending?: boolean;
  onTrain: () => void;
}) {
  const ready = quest.current >= quest.target;
  return (
    <section className={`boss-card ${ready ? "boss-defeated" : ""}`}>
      <div className="boss-figure" aria-hidden="true">
        <svg viewBox="0 0 200 210">
          <ellipse cx="100" cy="185" rx="70" ry="12" fill="#060818" />
          <g className="boss-body">
            <path
              d="M66 133L58 175H83L91 134M109 134L117 175H143L134 133"
              fill="#46455f"
              stroke="#8c79a7"
              strokeWidth="2"
            />
            <path
              d="M55 69L28 85L23 130L43 142L63 121M145 69L172 85L177 130L157 142L137 121"
              fill="#53516e"
              stroke="#9c88b8"
              strokeWidth="2"
            />
            <path
              d="M67 64L100 54L133 64L146 115L131 143H69L54 115Z"
              fill="#39384f"
              stroke="#ab89b3"
              strokeWidth="2"
            />
            <path
              d="M81 60L71 35L89 45L100 27L111 45L129 35L119 60"
              fill="#646078"
              stroke="#aa94b5"
              strokeWidth="2"
            />
            <path d="M75 57H125V85L100 96L75 85Z" fill="#232339" />
            <path d="M82 69H92M108 69H118" stroke="#ffb294" strokeWidth="5" />
            <path d="M100 101L114 116L100 133L86 116Z" fill="#ffb294" />
            <path
              d="M60 104L73 109M127 109L140 104"
              stroke="#aa94b5"
              strokeWidth="3"
            />
          </g>
          {!ready && (
            <ellipse
              cx="100"
              cy="106"
              rx="84"
              ry="79"
              fill="none"
              stroke="#c59aff"
              strokeDasharray="8 12"
              opacity=".35"
              className="boss-shield"
            />
          )}
        </svg>
        <span>
          {quest.claimed
            ? "RAID CLEARED"
            : ready
              ? "SHIELDS DOWN"
              : `${quest.target - quest.current} SHIELDS LEFT`}
        </span>
      </div>
      <div className="relative z-[1]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-violet-300">
          <Shield size={15} /> Weekly boss raid
        </div>
        <h3 className="mt-3 text-2xl font-black md:text-3xl">
          The Iron Colossus
        </h3>
        <p className="muted mt-2 max-w-md text-sm">
          Three training days. One epic victory. Every day you complete a
          workout removes a shield. Rest between battles.
        </p>
        <div className="my-5 flex gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`boss-shield-slot ${n <= quest.current ? "cleared" : ""}`}
            >
              {n <= quest.current ? <Check size={16} /> : <Shield size={16} />}
              <span>Day {n}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <RewardLabel xp={quest.xp} coins={quest.coins} />
          <button
            className="btn btn-small"
            disabled={quest.claimed || pending}
            onClick={() => (ready ? onClaim(quest) : onTrain())}
          >
            {quest.claimed
              ? "Victory collected"
              : pending
                ? "Claiming…"
                : ready
                  ? "Collect victory"
                  : "Enter training"}{" "}
            {!quest.claimed && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </section>
  );
}
export function WeekStrip({ game }: { game: GameData }) {
  return (
    <div className="week-strip">
      {game.days.map((day, i) => (
        <div
          key={day.day}
          className={`${day.day === game.today ? "today" : ""} ${day.trained ? "trained" : ""}`}
          title={`${day.day}${day.trained ? " · Workout completed" : ""}${day.fueled ? " · Nutrition logged" : ""}`}
        >
          <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
          <div>
            {day.trained ? (
              <Check size={14} />
            ) : (
              new Date(day.day + "T12:00:00Z").getUTCDate()
            )}
          </div>
          <span className={`fuel-dot ${day.fueled ? "logged" : ""}`} />
        </div>
      ))}
    </div>
  );
}
export function QuestsView({
  game,
  onClaim,
  pending,
  onTrain,
}: {
  game: GameData;
  onClaim: (q: Quest) => void;
  pending: string | null;
  onTrain: () => void;
}) {
  const [filter, setFilter] = useState<"active" | "achievements">("active");
  const boss = game.quests.find((q) => q.id === "weekly-boss")!;
  const nextWeek = new Date(game.week + "T12:00:00Z");
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  return (
    <div className="screen-enter">
      <div className="section-heading">
        <div>
          <div className="label text-violet-300">
            A little adventure, every day
          </div>
          <h2>Your quest log</h2>
          <p className="muted">
            Build a rhythm. Collect the rewards. Keep your own pace.
          </p>
        </div>
        <span className="soft-badge">
          {game.quests.filter((q) => q.claimed).length} rewards collected
        </span>
      </div>
      <BossRaid
        quest={boss}
        onClaim={onClaim}
        pending={pending === boss.id}
        onTrain={onTrain}
      />
      <section className="card my-5 flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="label">Your week in orbit</div>
          <p className="muted mt-2 text-sm">
            {game.stats.trainingDays} training days · {game.stats.nutritionDays}{" "}
            fuel check-ins
          </p>
        </div>
        <WeekStrip game={game} />
      </section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="segmented">
          <button
            className={filter === "active" ? "selected" : ""}
            onClick={() => setFilter("active")}
          >
            Daily & weekly
          </button>
          <button
            className={filter === "achievements" ? "selected" : ""}
            onClick={() => setFilter("achievements")}
          >
            Achievements
          </button>
        </div>
        <span className="muted text-xs">
          Weekly reset:{" "}
          {nextWeek.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
          })}{" "}
          · {game.timezone}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {game.quests
          .filter(
            (q) =>
              q.id !== "weekly-boss" &&
              (filter === "achievements"
                ? q.kind === "achievement"
                : q.kind !== "achievement"),
          )
          .map((q) => (
            <QuestCard
              key={q.id}
              quest={q}
              onClaim={onClaim}
              pending={pending === q.id}
            />
          ))}
      </div>
      <p className="muted mt-5 text-sm">
        XP and coins stay with you. Quests reset; missed days never take
        progress away.
      </p>
    </div>
  );
}
export function CharacterView({
  game,
  onSave,
}: {
  game: GameData;
  onSave: (character: CharacterData) => Promise<void>;
}) {
  const [draft, setDraft] = useState<CharacterData>(game.character);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const edit = (update: Partial<CharacterData>) => {
    setDraft((previous) => ({ ...previous, ...update }));
    setSaved(false);
  };
  const dirty = JSON.stringify(draft) !== JSON.stringify(game.character);
  return (
    <div className="screen-enter">
      <div className="section-heading">
        <div>
          <div className="label text-violet-300">
            Your journey. Your companion.
          </div>
          <h2>Meet your hero</h2>
          <p className="muted">Create a character that grows with you.</p>
        </div>
        <span className="soft-badge">
          <Sparkles size={14} /> Level {game.stats.level}
        </span>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <section className="hero-studio card">
          <div className="flex items-center justify-between">
            <span className="label">Live preview</span>
            <span className="soft-badge">
              {game.stats.level >= 10
                ? "Star guardian"
                : game.stats.level >= 5
                  ? "Orbit keeper"
                  : game.stats.level >= 3
                    ? "Rising hunter"
                    : "New explorer"}
            </span>
          </div>
          <Character character={draft} level={game.stats.level} />
          <div className="text-center">
            <h3 className="text-3xl font-black">{draft.name || "Your hero"}</h3>
            <p className="muted mt-2 capitalize">
              {draft.archetype} · Level {game.stats.level}
            </p>
            <p className="muted mt-5 text-xs">
              Tap your companion or try an animation.
            </p>
          </div>
        </section>
        <form
          className="card space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError("");
            try {
              await onSave(draft);
              setSaved(true);
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Could not save character",
              );
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="field">
            Hero name
            <input
              value={draft.name}
              minLength={2}
              maxLength={24}
              required
              onChange={(e) => edit({ name: e.target.value })}
              placeholder="Give your companion a name"
            />
          </label>
          <fieldset>
            <legend className="mb-3 font-bold">Choose your path</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {ARCHETYPES.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  className={`archetype-option ${draft.archetype === a.id ? "chosen" : ""}`}
                  aria-pressed={draft.archetype === a.id}
                  onClick={() => edit({ archetype: a.id })}
                >
                  <span>{a.symbol}</span>
                  <b>{a.name}</b>
                  <small>{a.description}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-3 font-bold">Energy color</legend>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={draft.color === c.id}
                  className={`color-option ${draft.color === c.id ? "chosen" : ""}`}
                  style={{ background: c.hex }}
                  onClick={() => edit({ color: c.id })}
                >
                  {draft.color === c.id && <Check size={20} />}
                </button>
              ))}
            </div>
            <p className="muted mt-2 text-xs">
              {COLORS.find((c) => c.id === draft.color)?.name}
            </p>
          </fieldset>
          <fieldset>
            <legend className="mb-3 font-bold">Gear & evolution</legend>
            <div className="grid grid-cols-2 gap-2">
              {ACCESSORIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`gear-option ${draft.accessory === a.id ? "chosen" : ""}`}
                  aria-pressed={draft.accessory === a.id}
                  disabled={game.stats.level < a.level}
                  onClick={() => edit({ accessory: a.id })}
                >
                  <span>
                    {game.stats.level < a.level ? (
                      <LockKeyhole size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}{" "}
                    {a.name}
                  </span>
                  <small>
                    {game.stats.level < a.level
                      ? `Unlocks at level ${a.level}`
                      : `Level ${a.level} · Unlocked`}
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="toggle-check"
              checked={draft.animations}
              onChange={(e) => edit({ animations: e.target.checked })}
            />{" "}
            Animate my companion and celebrations
          </label>
          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn" disabled={saving || (!dirty && !saved)}>
              {saving
                ? "Saving…"
                : saved && !dirty
                  ? "Character saved ✓"
                  : "Save character"}
            </button>
            {dirty && (
              <button
                className="ghost"
                type="button"
                disabled={saving}
                onClick={() => {
                  setDraft(game.character);
                  setSaved(false);
                }}
              >
                Reset preview
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
export function Celebration({
  data,
  character,
  onClose,
}: {
  data: CelebrationData;
  character: CharacterData;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const buttons = () =>
      Array.from(
        dialog.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ) ?? [],
      );
    buttons()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const targets = buttons();
      if (event.shiftKey && document.activeElement === targets[0]) {
        event.preventDefault();
        targets[targets.length - 1]?.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === targets[targets.length - 1]
      ) {
        event.preventDefault();
        targets[0]?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, []);
  return (
    <div
      className={`celebration-backdrop ${character.animations ? "" : "no-motion"}`}
      onClick={onClose}
    >
      <section
        ref={dialog}
        className="celebration-card"
        role="dialog"
        aria-modal="true"
        aria-label={data.levelUp ? "Level up" : data.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="celebration-close"
          aria-label="Close celebration"
          onClick={onClose}
          autoFocus
        >
          ×
        </button>
        {character.animations && (
          <div className="confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${4 + i * 5}%`,
                  animationDelay: `${(i % 5) * 0.12}s`,
                  background: ["#4ce0ce", "#b89aff", "#ffcb75", "#ff91b2"][
                    i % 4
                  ],
                }}
              />
            ))}
          </div>
        )}
        <div className="label text-violet-300">
          {data.levelUp ? "New level unlocked" : "Progress earned"}
        </div>
        <Character
          character={character}
          mood="celebrate"
          interactive={false}
          compact
        />
        <h2 className="text-3xl font-black">
          {data.levelUp ? "LEVEL UP!" : data.title}
        </h2>
        {data.levelUp && (
          <p className="muted mt-2">
            {data.title} · Check your hero for new unlocks.
          </p>
        )}
        <div className="celebration-loot">
          <span>
            <Zap size={20} /> +{data.xp} XP
          </span>
          <span>
            <Coins size={20} /> +{data.coins} coins
          </span>
        </div>
        {!!data.prs && (
          <p className="mt-3 text-amber-200">
            🏆 {data.prs} new personal record{data.prs === 1 ? "" : "s"}
          </p>
        )}
        <button className="btn mt-6 w-full" onClick={onClose}>
          Keep the adventure going →
        </button>
      </section>
    </div>
  );
}
