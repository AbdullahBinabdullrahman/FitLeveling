"use client";
import {
  ArrowRight,
  Coins,
  Dumbbell,
  Flame,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { levelFromXp, rank } from "@/lib/domain";
import type { GameData, Quest } from "@/lib/game";
import Character from "./Character";
import { BossRaid, QuestCard, WeekStrip } from "./GameViews";
export default function Dashboard({
  game,
  name,
  onNavigate,
  onClaim,
  pending,
}: {
  game: GameData;
  name: string;
  onNavigate: (tab: string) => void;
  onClaim: (q: Quest) => void;
  pending: string | null;
}) {
  const progress = levelFromXp(game.stats.lifetimeXp);
  const percent = Math.round((progress.remainder / progress.needed) * 100);
  const boss = game.quests.find((q) => q.id === "weekly-boss")!;
  const nextQuest =
    game.quests.find((q) => !q.claimed && q.current >= q.target) ??
    game.quests.find((q) => q.kind === "daily")!;
  return (
    <div className="screen-enter">
      <div className="section-heading">
        <div>
          <div className="label text-violet-300">Welcome back, {name}</div>
          <h2>Your next chapter starts here.</h2>
        </div>
        <span className="soft-badge">
          <Flame size={14} /> {game.stats.trainingDays} active days this week
        </span>
      </div>
      <div className="dashboard-top">
        <section className="adventure-hero">
          <div className="hero-copy">
            <span className="chapter-badge">
              <span /> CHAPTER {Math.floor((game.stats.level - 1) / 5) + 1} ·
              THE AWAKENING
            </span>
            <h2>
              Small steps.
              <br />
              <span>Legendary you.</span>
            </h2>
            <p>
              Your real-world effort powers {game.character.name}’s journey.
              Train, explore, and become a little stronger together.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn" onClick={() => onNavigate("Train")}>
                <Dumbbell size={17} />{" "}
                {game.stats.todayWorkouts ? "Open training" : "Start a mission"}{" "}
                <ArrowRight size={16} />
              </button>
              <button
                className="hero-customize"
                onClick={() => onNavigate("Hero")}
              >
                Customize hero
              </button>
            </div>
            <div className="hero-mini-stats">
              <span>
                <Trophy size={15} /> Rank {rank(game.stats.level)}
              </span>
              <span>
                <Zap size={15} /> {game.stats.lifetimeXp} lifetime XP
              </span>
            </div>
          </div>
          <div className="dashboard-character">
            <Character
              character={game.character}
              level={game.stats.level}
              compact
            />
            <div className="hero-nameplate">
              <span className="status-dot" />
              <b>{game.character.name}</b>
              <span>LV {game.stats.level}</span>
            </div>
          </div>
        </section>
        <section className="level-card">
          <div className="flex items-center justify-between">
            <span className="label">Your evolution</span>
            <Sparkles size={17} className="text-violet-300" />
          </div>
          <div className="xp-ring">
            <svg
              viewBox="0 0 160 160"
              aria-label={`${percent}% to next level`}
              role="img"
            >
              <circle
                cx="80"
                cy="80"
                r="66"
                fill="none"
                stroke="#28344e"
                strokeWidth="8"
              />
              <circle
                cx="80"
                cy="80"
                r="66"
                fill="none"
                stroke="#b89aff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="414.69"
                strokeDashoffset={414.69 * (1 - percent / 100)}
                transform="rotate(-90 80 80)"
                className="xp-ring-fill"
              />
            </svg>
            <div>
              <span className="label">LEVEL</span>
              <b>{game.stats.level}</b>
            </div>
          </div>
          <div className="text-center">
            <b className="text-sm">
              {progress.remainder}{" "}
              <span className="muted">/ {progress.needed} XP</span>
            </b>
            <p className="muted mt-1 text-xs">
              {progress.needed - progress.remainder} XP to your next level
            </p>
          </div>
          <div className="next-unlock">
            <LockIcon />
            <span>
              Next unlock
              <b>
                {game.stats.level < 3
                  ? "Hunter cape · Level 3"
                  : game.stats.level < 5
                    ? "Orbit halo · Level 5"
                    : game.stats.level < 10
                      ? "Star crown · Level 10"
                      : "All hero gear unlocked"}
              </b>
            </span>
          </div>
        </section>
      </div>
      <div className="dashboard-stats">
        <div>
          <span className="stat-icon mint">
            <Dumbbell size={20} />
          </span>
          <div>
            <b>{game.stats.workouts}</b>
            <span>Completed missions</span>
          </div>
        </div>
        <div>
          <span className="stat-icon amber">
            <Coins size={20} />
          </span>
          <div>
            <b>{game.stats.coins}</b>
            <span>Coins to enjoy</span>
          </div>
          <button
            onClick={() => onNavigate("Shop")}
            aria-label="Open reward shop"
          >
            <ArrowRight size={18} />
          </button>
        </div>
        <div>
          <span className="stat-icon violet">
            <Flame size={20} />
          </span>
          <div>
            <b>
              {game.stats.trainingDays} <small>/ 3</small>
            </b>
            <span>Boss shields cleared</span>
          </div>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1.5fr_1fr]">
        <BossRaid
          quest={boss}
          onClaim={onClaim}
          pending={pending === boss.id}
          onTrain={() => onNavigate("Train")}
        />
        <QuestCard
          quest={nextQuest}
          onClaim={onClaim}
          pending={pending === nextQuest.id}
        />
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="card">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Your weekly rhythm</h3>
            <button
              className="text-sm text-violet-300"
              onClick={() => onNavigate("Quests")}
            >
              Quest log →
            </button>
          </div>
          <WeekStrip game={game} />
          <p className="muted text-xs">
            ✓ Training · glowing dot = fuel check-in · recovery is part of the
            journey
          </p>
        </section>
        <section className="card flex flex-col justify-between">
          <div>
            <div className="label">Need a spark?</div>
            <h3 className="mt-2 text-xl font-bold">
              Your companion has your back.
            </h3>
            <p className="muted mt-2 text-sm">
              Find a next step that fits your energy today.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="ghost btn-small"
              onClick={() => onNavigate("Coach")}
            >
              <Sparkles size={14} /> Talk to your coach
            </button>
            <button
              className="text-sm text-violet-300"
              onClick={() => onNavigate("Progress")}
            >
              Check in & see progress →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
function LockIcon() {
  return <Sparkles size={20} className="text-violet-300" />;
}
