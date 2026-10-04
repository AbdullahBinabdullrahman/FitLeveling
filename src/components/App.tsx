"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dumbbell,
  Gift,
  House,
  UserRound,
  TrendingUp,
  Coins,
  Sparkles,
  Swords,
  Bot,
  ArrowRight,
  Pause,
  Play,
  TimerReset,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import CharacterArt from "./game/Character";
import Dashboard from "./game/Dashboard";
import CoachView from "./game/CoachView";
import AccountSettings from "./game/AccountSettings";
import HabitsView from "./game/HabitsView";
import CommunityView from "./game/CommunityView";
import CosmeticShop from "./game/CosmeticShop";
import { CharacterView, Celebration, QuestsView } from "./game/GameViews";
import type { Character, GameData, Quest, CelebrationData } from "@/lib/game";
import { dayKey } from "@/lib/game";
type User = { id: string; name: string; email: string };
type Profile = {
  heightCm: string | null;
  currentWeightKg: string | null;
  startingWeightKg: string | null;
  birthYear: number | null;
  sexForEstimate: string | null;
  activityFactor: string | null;
  goal: string | null;
  calorieTarget: number;
  proteinMin: number;
  proteinMax: number;
  level: number;
  lifetimeXp: number;
  coins: number;
  timezone: string;
};
type Plan = {
  templateId: string;
  templateName: string;
  exerciseId: string;
  exerciseName: string;
  position: number;
  sets: number;
  repMin: number;
  repMax: number;
};
type Workout = {
  plan: Plan[];
  history: { id: string; templateId: string; completedAt: string }[];
  profile: Profile;
  active: { id: string; templateId: string } | null;
  activeSets: {
    exerciseId: string;
    setNumber: number;
    weightKg: string;
    reps: number;
  }[];
  past: { exerciseId: string; weightKg: string; reps: number }[];
};
type Scan = {
  id: string;
  measuredAt: string;
  weightKg: string;
  bodyFatPercent: string | null;
  skeletalMuscleKg: string | null;
  attachmentKey: string | null;
};
type Weight = { weightKg: string; measuredAt: string };
type Reward = { id: string; name: string; cost: number };
async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const r = await fetch("/api/" + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}
const NAV = [
  { name: "Home", icon: House },
  { name: "Train", icon: Dumbbell },
  { name: "Quests", icon: Swords },
  { name: "Hero", icon: Sparkles },
  { name: "Coach", icon: Bot },
  { name: "Community", icon: Users },
  { name: "Habits", icon: Users },
  { name: "Progress", icon: TrendingUp },
  { name: "Shop", icon: Gift },
  { name: "Settings", icon: UserRound },
];
export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [tab, setTab] = useState("Home");
  const [data, setData] = useState<Workout | null>(null);
  const [game, setGame] = useState<GameData | null>(null);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [session, setSession] = useState<{
    id: string;
    templateId: string;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const load = useCallback(async () => {
    const [w, wt, ib, rs, g] = await Promise.allSettled([
      api<Workout>("workouts"),
      api<{ weights: Weight[] }>("weight"),
      api<{ scans: Scan[] }>("inbody"),
      api<{ rewards: Reward[] }>("rewards"),
      api<GameData>("game"),
    ]);
    if (w.status === "rejected") throw w.reason;
    if (g.status === "rejected") throw g.reason;
    setData(w.value);
    if (wt.status === "fulfilled") setWeights(wt.value.weights);
    if (ib.status === "fulfilled") setScans(ib.value.scans);
    if (rs.status === "fulfilled") setRewards(rs.value.rewards);
    if ([wt, ib, rs].some((r) => r.status === "rejected"))
      setError("Some records could not load. Refresh to try again.");
    setGame(g.value);
    setSession(w.value.active);
    setSelected(
      (previous) =>
        w.value.active?.templateId ??
        (w.value.plan.some((p) => p.templateId === previous) ? previous : null),
    );
  }, []);
  useEffect(() => {
    api<{ user: User | null }>("auth")
      .then(async (x) => {
        setUser(x.user);
        if (x.user)
          try {
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          }
      })
      .catch(() => setUser(null));
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, [load]);
  const actionBusy = useRef(false);
  const act = async (fn: () => Promise<unknown>) => {
    if (actionBusy.current) return false;
    actionBusy.current = true;
    setError("");
    setMessage("");
    try {
      await fn();
      try {
        await load();
        setMessage("Saved successfully");
      } catch {
        setMessage("Saved successfully. Refresh to load your latest data.");
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      actionBusy.current = false;
    }
  };
  const claim = async (quest: Quest) => {
    if (claiming) return;
    setClaiming(quest.id);
    setError("");
    setMessage("");
    try {
      const result = await api<CelebrationData & { alreadyClaimed?: boolean }>(
        "game",
        "POST",
        { questId: quest.id },
      );
      if (!result.alreadyClaimed)
        setCelebration({ ...result, title: quest.title });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setClaiming(null);
    }
  };
  const saveCharacter = async (character: Character) => {
    await api("game", "PATCH", character);
    await load();
  };
  const logout = async () => {
    await api("auth", "DELETE");
    setUser(null);
    setGame(null);
    setData(null);
    setTab("Home");
    setCelebration(null);
    setError("");
    setMessage("");
  };
  if (user === undefined)
    return (
      <main className="loading-screen">
        <span className="loading-orbit" />
        <p>Opening your next chapter…</p>
      </main>
    );
  if (!user)
    return (
      <Auth
        onDone={(u) => {
          setUser(u);
          setTab("Home");
          load().catch((e) => setError(e.message));
        }}
      />
    );
  return (
    <div
      className={`app-shell ${game?.character.animations === false ? "reduce-motion" : ""}`}
    >
      <header className="app-header">
        <button
          className="brand"
          onClick={() => setTab("Home")}
          aria-label="LevelUp home"
        >
          <span className="brand-mark">
            <ZapMark />
          </span>
          <span>
            LEVEL<span className="text-violet-300">UP</span>
            <small>MAKE EVERY DAY AN ADVENTURE</small>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button
            className="coin-balance"
            onClick={() => setTab("Shop")}
            aria-label={`${data?.profile.coins ?? 0} coins. Open shop`}
          >
            <Coins size={17} />
            {data?.profile.coins ?? 0}
          </button>
          <button
            className="profile-chip"
            aria-label="Open account settings"
            onClick={() => setTab("Settings")}
          >
            <UserRound size={16} />
            <span>{user.name}</span>
          </button>
        </div>
      </header>
      <nav className="desktop-nav" aria-label="Main navigation">
        {NAV.map(({ name, icon: Icon }) => (
          <button
            key={name}
            aria-current={tab === name ? "page" : undefined}
            className={`navbtn ${tab === name ? "active" : ""}`}
            onClick={() => setTab(name)}
          >
            <Icon size={17} />
            {name}
            {name === "Quests" &&
              game &&
              game.quests.some((q) => !q.claimed && q.current >= q.target) && (
                <span className="nav-notification" />
              )}
          </button>
        ))}
      </nav>
      <nav className="mobile-utilities" aria-label="Health and rewards">
        {NAV.slice(5).map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={tab === name ? "selected" : ""}
            onClick={() => setTab(name)}
          >
            <Icon size={14} />
            {name}
          </button>
        ))}
      </nav>
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-500/50 bg-red-950/50 p-3 text-red-200"
        >
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="save-toast">
          <span>✓</span>
          {message}
          <button aria-label="Dismiss message" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}
      {tab === "Settings" ? (
        <>
          <AccountSettings
            onSaved={(next) => {
              setUser(next);
              load().catch((e) => setError(e.message));
            }}
          />
          {data && (
            <ProfileView
              profile={data?.profile}
              scans={scans}
              act={act}
              logout={() => logout().catch((e) => setError(e.message))}
            />
          )}
        </>
      ) : !game || !data ? (
        <section className="card">
          <p className="muted mb-4">
            {error
              ? "Your game couldn’t load. Please retry."
              : "Loading your companion and missions…"}
          </p>
          <button
            className="btn"
            onClick={() =>
              load()
                .then(() => setError(""))
                .catch((e) => setError(e.message))
            }
          >
            Retry loading
          </button>
          <button
            className="ghost ml-3"
            onClick={() => logout().catch((e) => setError(e.message))}
          >
            Sign out
          </button>
        </section>
      ) : (
        <>
          {tab === "Home" && (
            <Dashboard
              game={game}
              name={user.name}
              onNavigate={setTab}
              onClaim={claim}
              pending={claiming}
            />
          )}
          {tab === "Quests" && (
            <QuestsView
              game={game}
              onClaim={claim}
              pending={claiming}
              onTrain={() => setTab("Train")}
            />
          )}
          {tab === "Hero" && (
            <CharacterView key={user.id} game={game} onSave={saveCharacter} />
          )}
          {tab === "Coach" && (
            <CoachView key={user.id} game={game} onPlanApplied={load} />
          )}
          {tab === "Train" && (
            <Train
              game={game}
              data={data}
              session={session}
              selected={selected}
              setSelected={setSelected}
              act={act}
              setSession={setSession}
              celebrate={setCelebration}
            />
          )}
          {tab === "Progress" && (
            <Progress weights={weights} scans={scans} data={data} act={act} />
          )}
          {tab === "Community" && <CommunityView onNavigate={setTab} />}
          {tab === "Habits" && <HabitsView />}
          {tab === "Shop" && (
            <>
              <CosmeticShop game={game} onChange={load} />
              <details className="card mt-8">
                <summary className="font-bold cursor-pointer">
                  Personal rewards
                </summary>
                <div className="mt-5">
                  <Shop
                    rewards={rewards}
                    coins={data.profile.coins}
                    act={act}
                  />
                </div>
              </details>
            </>
          )}
        </>
      )}
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV.slice(0, 5).map(({ name, icon: Icon }) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            aria-current={tab === name ? "page" : undefined}
            onClick={() => setTab(name)}
          >
            <Icon size={20} />
            <span>{name}</span>
            {name === "Quests" &&
              game &&
              game.quests.some((q) => !q.claimed && q.current >= q.target) && (
                <i />
              )}
          </button>
        ))}
      </nav>
      {celebration && game && (
        <Celebration
          data={celebration}
          character={game.character}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
function ZapMark() {
  return (
    <svg
      width="21"
      height="24"
      viewBox="0 0 21 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 1L2 14H9L8 23L19 10H12L12 1Z" fill="currentColor" />
    </svg>
  );
}
function Auth({ onDone }: { onDone: (u: User) => void }) {
  const [register, setRegister] = useState(false),
    [form, setForm] = useState({ name: "", email: "", password: "", code: "" }),
    [error, setError] = useState("");
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-5">
      <form
        className="card w-full space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const r = await api<{ user: User }>(
              "auth",
              "POST",
              register ? form : { email: form.email, password: form.password },
            );
            onDone(r.user);
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        <div className="label">YOUR JOURNEY STARTS HERE</div>
        <h1 className="text-4xl font-black">
          LEVEL<span className="text-teal-300">UP</span>
        </h1>
        {register && (
          <label className="field">
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
        )}
        <label className="field">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            minLength={10}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        {register && (
          <label className="field">
            Registration code
            <input
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </label>
        )}
        {error && <p className="text-red-300">{error}</p>}
        <button className="btn w-full">
          {register ? "CREATE ACCOUNT" : "SIGN IN"}
        </button>
        <button
          type="button"
          className="muted w-full"
          onClick={() => setRegister(!register)}
        >
          {register ? "Have an account? Sign in" : "First time? Create account"}
        </button>
      </form>
    </main>
  );
}
function Train({
  game,
  data,
  session,
  selected,
  setSelected,
  act,
  setSession,
  celebrate,
}: {
  game: GameData;
  data: Workout | null;
  session: { id: string; templateId: string } | null;
  selected: string | null;
  setSelected: (s: string) => void;
  act: (fn: () => Promise<unknown>) => Promise<boolean>;
  setSession: (s: { id: string; templateId: string } | null) => void;
  celebrate: (result: CelebrationData) => void;
}) {
  const plans = [
    ...new Map(data?.plan.map((p) => [p.templateId, p.templateName]) ?? []),
  ];
  const chosen = session?.templateId ?? selected ?? plans[0]?.[0];
  const items = data?.plan.filter((p) => p.templateId === chosen) ?? [];
  const [values, setValues] = useState<
    Record<string, { weightKg: number; reps: number }>
  >({});
  const [pending, setPending] = useState<string | null>(null);
  const [restToken, setRestToken] = useState(0);
  const [missionEntry, setMissionEntry] = useState(false);
  useEffect(() => {
    setValues({});
  }, [session?.id]);
  const totalSets = items.reduce((count, item) => count + item.sets, 0);
  const savedSets = data?.activeSets.length ?? 0;
  const completed = new Set(
    data?.activeSets.map((s) => `${s.exerciseId}:${s.setNumber}`),
  );
  async function run(key: string, fn: () => Promise<unknown>) {
    if (pending) return;
    setPending(key);
    try {
      return await act(fn);
    } finally {
      setPending(null);
    }
  }
  return (
    <div className="screen-enter">
      <div className="section-heading">
        <div>
          <div className="label text-violet-300">Mission control</div>
          <h2>
            {session ? "Your mission is live." : "Choose your next adventure."}
          </h2>
          <p className="muted">
            Focus on the next set. Every logged rep is a step forward.
          </p>
        </div>
        {session && (
          <span className="soft-badge">
            <span className="status-dot" /> Workout active
          </span>
        )}
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {plans.map(([id, name]) => (
          <button
            className={chosen === id ? "btn" : "ghost"}
            key={id}
            disabled={!!pending || (!!session && session.templateId !== id)}
            onClick={() => setSelected(id)}
          >
            {name}
          </button>
        ))}
      </div>
      {session ? (
        <section className="training-control card mb-5">
          <div className="training-progress">
            <div className="mb-2 flex justify-between gap-3">
              <b>
                {savedSets} / {totalSets} sets logged
              </b>
              <span className="muted text-sm">
                {totalSets ? Math.round((savedSets / totalSets) * 100) : 0}%
              </span>
            </div>
            <div className="game-progress">
              <div
                style={{
                  width: `${totalSets ? (savedSets / totalSets) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="muted mt-2 text-xs">
              Complete all sets for +25 bonus XP. Finish after at least 3 sets.
            </p>
          </div>
          <button
            className="btn"
            disabled={!!pending || savedSets < 3}
            onClick={() =>
              run("complete", async () => {
                const result = await api<{
                  xp: number;
                  coins: number;
                  prs: number;
                  levelUp?: boolean;
                  alreadyCompleted?: boolean;
                }>("workouts", "PUT", { sessionId: session.id });
                setRestToken(0);
                setSession(null);
                if (!result.alreadyCompleted)
                  celebrate({ ...result, title: "Mission complete!" });
              })
            }
          >
            {pending === "complete" ? "Completing…" : "Complete mission"}{" "}
            <ArrowRight size={16} />
          </button>
        </section>
      ) : (
        <button
          className="btn mb-6"
          disabled={!chosen || !!pending}
          onClick={() =>
            run("start", async () => {
              const r = await api<{
                session: { id: string; templateId: string };
              }>("workouts", "POST", { templateId: chosen });
              setRestToken(0);
              setSession(r.session);
              setMissionEntry(true);
            })
          }
        >
          {pending === "start" ? "Starting…" : "Start workout"}{" "}
          <Dumbbell size={17} />
        </button>
      )}
      <section
        className={`workout-hero card ${missionEntry ? "mission-entered" : ""}`}
      >
        <CharacterArt
          character={game.character}
          level={game.stats.level}
          compact
          interactive={false}
          mood={session ? "power" : "idle"}
        />
        <div>
          <div className="label text-violet-300">
            {session ? "Mission in progress" : "Mission briefing"}
          </div>
          <h3 className="text-2xl font-bold mt-2">
            {session
              ? `${game.character.name} is training with you.`
              : "Your next adventure starts here."}
          </h3>
          <p className="muted text-sm mt-2">
            {session
              ? "Every logged set brings this mission closer to completion. Rest when you need it."
              : "Bring your equipped gear. Complete at least three sets to finish the mission and collect your rewards."}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="soft-badge">100 base XP</span>
            <span className="soft-badge">20 base coins</span>
            <span className="soft-badge">+25 XP for all sets</span>
          </div>
          <p className="muted text-xs mt-3">
            Rewards are credited when you complete the mission. Personal records
            can earn extra XP and coins.
          </p>
          {missionEntry && (
            <p role="status" className="text-teal-300 text-sm mt-2">
              Mission started. Let’s earn your next unlock.
            </p>
          )}
        </div>
      </section>
      {session && <RestTimer startToken={restToken} />}
      <div className="grid gap-4">
        {items.map((item) => (
          <section className="card" key={item.exerciseId}>
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="text-xl font-bold">{item.exerciseName}</h3>
              <span className="label">
                {item.sets} × {item.repMin}–{item.repMax}
              </span>
            </div>
            <p className="muted my-3 text-sm">
              Previous logged weight:{" "}
              {data?.past.find((p) => p.exerciseId === item.exerciseId)
                ?.weightKg ?? "—"}{" "}
              kg
            </p>
            <div className="mb-2 grid grid-cols-[30px_1fr_1fr_80px] gap-2 text-xs text-slate-400">
              <span>Set</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
              <span className="text-center">Log</span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: item.sets }, (_, n) => {
                const key = `${item.exerciseId}:${n + 1}`;
                const saved = data?.activeSets.find(
                  (s) =>
                    s.exerciseId === item.exerciseId && s.setNumber === n + 1,
                );
                const value = values[key] ?? {
                  weightKg: Number(
                    saved?.weightKg ??
                      data?.past.find((p) => p.exerciseId === item.exerciseId)
                        ?.weightKg ??
                      0,
                  ),
                  reps: saved?.reps ?? item.repMin,
                };
                const done = completed.has(key);
                return (
                  <div
                    className={`set-row grid grid-cols-[30px_1fr_1fr_80px] items-center gap-2 ${done ? "logged" : ""}`}
                    key={key}
                  >
                    <span className="muted">{n + 1}</span>
                    <input
                      aria-label={`${item.exerciseName} set ${n + 1} weight kg`}
                      type="number"
                      min="0"
                      max="500"
                      step="0.5"
                      value={value.weightKg}
                      disabled={!!pending}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [key]: { ...value, weightKg: Number(e.target.value) },
                        })
                      }
                    />
                    <input
                      aria-label={`${item.exerciseName} set ${n + 1} reps`}
                      type="number"
                      min="1"
                      max="100"
                      value={value.reps}
                      disabled={!!pending}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [key]: { ...value, reps: Number(e.target.value) },
                        })
                      }
                    />
                    <button
                      className={done ? "btn" : "ghost"}
                      disabled={!session || !!pending}
                      onClick={async () => {
                        const ok = await run(key, () =>
                          api("workouts", "PATCH", {
                            sessionId: session!.id,
                            exerciseId: item.exerciseId,
                            setNumber: n + 1,
                            ...value,
                          }),
                        );
                        if (ok && !done) setRestToken((t) => t + 1);
                      }}
                    >
                      {pending === key ? "…" : done ? "✓" : "LOG"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
function RestTimer({ startToken }: { startToken: number }) {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [end, setEnd] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (startToken > 0) {
      setRemaining(duration);
      setEnd(Date.now() + duration * 1000);
      setStarted(true);
    }
  }, [startToken]);
  useEffect(() => {
    if (!end) return;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setEnd(null);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [end]);
  return (
    <section className="rest-timer mb-5">
      <div className="flex items-center gap-3">
        <span className="stat-icon violet">
          <TimerReset size={20} />
        </span>
        <div>
          <b>
            {started && remaining === 0
              ? "Ready when you are."
              : "Recovery break"}
          </b>
          <p className="muted text-xs">
            {started && remaining === 0
              ? "Your timer is done. Take more rest if you need it."
              : "A short pause between sets. No rush."}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="timer-digits"
          aria-label={`${Math.floor(remaining / 60)} minutes ${remaining % 60} seconds remaining`}
        >
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
        </span>
        <select
          aria-label="Rest duration"
          value={duration}
          onChange={(e) => {
            const seconds = Number(e.target.value);
            setDuration(seconds);
            setRemaining(seconds);
            if (end) setEnd(Date.now() + seconds * 1000);
          }}
        >
          {[60, 90, 120, 180].map((s) => (
            <option key={s} value={s}>
              {s}s
            </option>
          ))}
        </select>
        <button
          className="ghost"
          aria-label={end ? "Pause rest timer" : "Start rest timer"}
          onClick={() => {
            if (end) {
              setRemaining(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
              setEnd(null);
            } else {
              const seconds = remaining || duration;
              setRemaining(seconds);
              setEnd(Date.now() + seconds * 1000);
              setStarted(true);
            }
          }}
        >
          {end ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>
    </section>
  );
}
function Progress({
  weights,
  scans,
  data,
  act,
}: {
  weights: Weight[];
  scans: Scan[];
  data: Workout | null;
  act: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  return (
    <div>
      <div className="label">THE JOURNEY</div>
      <h2 className="mb-5 text-3xl font-black">Your progress</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <section className="card">
          <h3 className="mb-3 text-xl font-bold">Body weight</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weights
                  .slice()
                  .reverse()
                  .map((w) => ({
                    day: new Date(w.measuredAt).toLocaleDateString(),
                    kg: Number(w.weightKg),
                  }))}
              >
                <XAxis dataKey="day" hide />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                <Tooltip />
                <Line dataKey="kg" stroke="#4ce0ce" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              act(() =>
                api("weight", "POST", { weightKg: Number(weight) }),
              ).then((saved) => {
                if (saved) setWeight("");
              });
            }}
          >
            <input
              type="number"
              step="0.1"
              min="25"
              placeholder="Weight (kg)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
            <button className="btn">LOG</button>
          </form>
        </section>
        <section className="card">
          <h3 className="mb-3 text-xl font-bold">Training</h3>
          <div className="text-5xl font-black text-teal-300">
            {data?.history.length ?? 0}
          </div>
          <p className="muted">Recent completed workouts</p>
          <div className="mt-5 space-y-2">
            {data?.history.slice(0, 5).map((h) => (
              <div className="rounded-xl bg-slate-800 p-3" key={h.id}>
                {
                  data.plan.find((p) => p.templateId === h.templateId)
                    ?.templateName
                }{" "}
                · {new Date(h.completedAt).toLocaleDateString()}
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h3 className="mb-3 text-xl font-bold">Nutrition check-in</h3>
          <p className="muted mb-3">
            Target: {data?.profile.calorieTarget} kcal ·{" "}
            {data?.profile.proteinMin}–{data?.profile.proteinMax} g protein
          </p>
          <form
            className="gridform"
            onSubmit={(e) => {
              e.preventDefault();
              act(() =>
                api("nutrition", "POST", {
                  day: dayKey(new Date(), data?.profile.timezone),
                  calories: Number(calories),
                  proteinG: Number(protein),
                }),
              );
            }}
          >
            <input
              type="number"
              placeholder="Calories"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
            />
            <input
              type="number"
              placeholder="Protein (g)"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              required
            />
            <button className="btn">SAVE TODAY</button>
          </form>
        </section>
        <section className="card">
          <h3 className="mb-3 text-xl font-bold">InBody trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={scans
                  .slice()
                  .reverse()
                  .map((s) => ({
                    day: s.measuredAt,
                    fat: Number(s.bodyFatPercent),
                    muscle: Number(s.skeletalMuscleKg),
                  }))}
              >
                <XAxis dataKey="day" hide />
                <YAxis />
                <Tooltip />
                <Line dataKey="fat" stroke="#fbad75" />
                <Line dataKey="muscle" stroke="#4ce0ce" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="muted text-sm">
            Fat % and skeletal muscle kg. Compare scans under similar
            conditions.
          </p>
        </section>
      </div>
    </div>
  );
}
function Shop({
  rewards,
  coins,
  act,
}: {
  rewards: Reward[];
  coins: number;
  act: (fn: () => Promise<unknown>) => Promise<boolean>;
}) {
  const [name, setName] = useState(""),
    [cost, setCost] = useState("");
  return (
    <div>
      <div className="label">REWARDS</div>
      <h2 className="mb-2 text-3xl font-black">Hunter shop</h2>
      <p className="muted mb-5">
        Balance: {coins} coins. Rewards are personal, with no cash value.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {rewards.map((r) => (
          <section className="card" key={r.id}>
            <Gift className="text-teal-300" />
            <h3 className="mt-5 text-xl font-bold">{r.name}</h3>
            <div className="muted mt-2">🪙 {r.cost}</div>
            <button
              className="btn mt-5"
              disabled={coins < r.cost}
              onClick={() => {
                if (confirm(`Redeem ${r.name} for ${r.cost} coins?`))
                  act(() => api("rewards", "PUT", { rewardId: r.id }));
              }}
            >
              REDEEM
            </button>
          </section>
        ))}
      </div>
      <form
        className="card mt-5 gridform"
        onSubmit={(e) => {
          e.preventDefault();
          act(() => api("rewards", "POST", { name, cost: Number(cost) })).then(
            (saved) => {
              if (saved) {
                setName("");
                setCost("");
              }
            },
          );
        }}
      >
        <input
          placeholder="Custom reward"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="number"
          min="1"
          placeholder="Coin cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          required
        />
        <button className="btn">ADD REWARD</button>
      </form>
    </div>
  );
}
function ProfileView({
  profile,
  scans,
  act,
  logout,
}: {
  profile: Profile | undefined;
  scans: Scan[];
  act: (fn: () => Promise<unknown>) => Promise<boolean>;
  logout: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
      heightCm: profile?.heightCm ?? "168",
      currentWeightKg: profile?.currentWeightKg ?? "99",
      birthYear: String(profile?.birthYear ?? 1996),
      sexForEstimate: profile?.sexForEstimate ?? "male",
      activityFactor: profile?.activityFactor ?? "1.375",
      goal: profile?.goal ?? "lose",
    }),
    [proposal, setProposal] = useState<{
      calories: number;
      proteinMin: number;
      proteinMax: number;
      maintenance: number;
    } | null>(null),
    [scan, setScan] = useState({
      measuredAt: dayKey(new Date(), profile?.timezone),
      weightKg: "",
      bodyFatPercent: "",
      skeletalMuscleKg: "",
      fatMassKg: "",
      measuredBmr: "",
    });
  useEffect(() => {
    setProposal(null);
  }, [form]);
  const payload = (applyTargets: boolean) => ({
    heightCm: Number(form.heightCm),
    currentWeightKg: Number(form.currentWeightKg),
    birthYear: Number(form.birthYear),
    sexForEstimate: form.sexForEstimate,
    activityFactor: Number(form.activityFactor),
    goal: form.goal,
    applyTargets,
  });
  return (
    <div>
      <div className="label">PERSONAL STATUS</div>
      <h2 className="mb-5 text-3xl font-black">Profile & targets</h2>
      <section className="card mb-5">
        <h3 className="mb-4 text-xl font-bold">Your details</h3>
        <div className="gridform">
          {[
            ["heightCm", "Height (cm)"],
            ["currentWeightKg", "Current weight (kg)"],
            ["birthYear", "Birth year"],
          ].map(([key, label]) => (
            <label className="field" key={key}>
              {label}
              <input
                type="number"
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="field">
            Estimate sex
            <select
              value={form.sexForEstimate}
              onChange={(e) =>
                setForm({ ...form, sexForEstimate: e.target.value })
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="field">
            Activity factor
            <select
              value={form.activityFactor}
              onChange={(e) =>
                setForm({ ...form, activityFactor: e.target.value })
              }
            >
              <option value="1.2">Mostly seated</option>
              <option value="1.375">Light activity</option>
              <option value="1.55">Moderate activity</option>
              <option value="1.725">High activity</option>
            </select>
          </label>
          <label className="field">
            Goal
            <select
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
            >
              <option value="lose">Lose weight</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain weight</option>
            </select>
          </label>
        </div>
        <button
          className="btn mt-5"
          onClick={() =>
            act(async () => {
              const r = await api<{ proposal: typeof proposal }>(
                "profile",
                "PATCH",
                payload(false),
              );
              setProposal(r.proposal);
            })
          }
        >
          SAVE & REVIEW TARGET
        </button>
        {proposal && (
          <div className="mt-5 rounded-xl border border-teal-600 bg-teal-950/40 p-4">
            <h4 className="font-bold">Suggested adjustment</h4>
            <p className="mt-2">
              Calories: {profile?.calorieTarget} → <b>{proposal.calories}</b>{" "}
              kcal/day
            </p>
            <p>
              Protein: {profile?.proteinMin}–{profile?.proteinMax} →{" "}
              <b>
                {proposal.proteinMin}–{proposal.proteinMax}
              </b>{" "}
              g/day
            </p>
            <p className="muted mt-2 text-sm">
              Estimated maintenance: {proposal.maintenance} kcal. Formula based
              estimate; review against multi-week trends.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="btn"
                onClick={() =>
                  act(async () => {
                    await api("profile", "PATCH", payload(true));
                    setProposal(null);
                  })
                }
              >
                APPLY NEW TARGET
              </button>
              <button className="ghost" onClick={() => setProposal(null)}>
                KEEP CURRENT
              </button>
            </div>
          </div>
        )}
      </section>
      <section className="card mb-5">
        <h3 className="mb-2 text-xl font-bold">InBody scan</h3>
        <p className="muted mb-4">
          Enter confirmed report values, and optionally attach the original
          image or PDF. Automatic extraction is coming later.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            act(async () => {
              const payload = {
                measuredAt: scan.measuredAt,
                weightKg: Number(scan.weightKg),
                ...(scan.bodyFatPercent
                  ? { bodyFatPercent: Number(scan.bodyFatPercent) }
                  : {}),
                ...(scan.skeletalMuscleKg
                  ? { skeletalMuscleKg: Number(scan.skeletalMuscleKg) }
                  : {}),
                ...(scan.fatMassKg
                  ? { fatMassKg: Number(scan.fatMassKg) }
                  : {}),
                ...(scan.measuredBmr
                  ? { measuredBmr: Number(scan.measuredBmr) }
                  : {}),
              };
              if (!file) return api("inbody", "POST", payload);
              const formData = new FormData();
              Object.entries(payload).forEach(([k, v]) =>
                formData.append(k, String(v)),
              );
              formData.append("file", file);
              const r = await fetch("/api/inbody/upload", {
                method: "POST",
                body: formData,
              });
              if (!r.ok)
                throw new Error((await r.json()).error || "Upload failed");
              setFile(null);
            });
          }}
          className="gridform"
        >
          {Object.entries({
            measuredAt: "Scan date",
            weightKg: "Weight kg",
            bodyFatPercent: "Body fat %",
            skeletalMuscleKg: "Skeletal muscle kg",
            fatMassKg: "Fat mass kg",
            measuredBmr: "BMR kcal",
          }).map(([key, label]) => (
            <label className="field" key={key}>
              {label}
              <input
                type={key === "measuredAt" ? "date" : "number"}
                step={key === "measuredAt" ? undefined : "0.1"}
                required={key === "measuredAt" || key === "weightKg"}
                value={scan[key as keyof typeof scan]}
                onChange={(e) => setScan({ ...scan, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="field">
            Original report (optional)
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/heic"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button className="btn self-end">SAVE SCAN</button>
        </form>
        <div className="mt-5 space-y-2">
          {scans.slice(0, 5).map((s) => (
            <div className="rounded-xl bg-slate-800 p-3" key={s.id}>
              {s.measuredAt} · {s.weightKg} kg · {s.bodyFatPercent ?? "—"}% body
              fat · {s.skeletalMuscleKg ?? "—"} kg muscle{" "}
              {s.attachmentKey && (
                <button
                  className="ml-2 text-teal-300 underline"
                  onClick={async () => {
                    try {
                      const r = await api<{ url: string }>(
                        `inbody/upload?scanId=${s.id}`,
                      );
                      window.open(r.url, "_blank", "noopener,noreferrer");
                    } catch (e) {
                      alert(String(e));
                    }
                  }}
                >
                  View report
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
      <button className="ghost" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}
