"use client";
import { useEffect, useState } from "react";
import { Trophy, Heart, Users, Sparkles, ArrowRight } from "lucide-react";
import type { Character as CharacterData } from "@/lib/game";
import Character from "./Character";
import FriendsPanel from "./FriendsPanel";
type Member = {
  userId: string;
  alias: string;
  rank: number;
  level: number;
  score: number;
  league: string;
  training: number;
  fuel: number;
  checkin: number;
  cheers: number;
  cheered: boolean;
  character: CharacterData;
};
type Community = {
  week: string;
  next: string;
  userId: string;
  member: { alias: string } | null;
  leaderboard: Member[];
  you: Member | null;
  totalMembers: number;
  communityScore: number;
  communityTarget: number;
};
export default function CommunityView({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const [socialTab, setSocialTab] = useState("guild");
  const [data, setData] = useState<Community>(),
    [alias, setAlias] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const res = await fetch("/api/community");
    const d = await res.json();
    if (!res.ok) throw new Error(d.error);
    setData(d);
    setAlias(d.member?.alias ?? "");
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function action(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      await load();
      setNotice("Community updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
    } finally {
      setBusy(false);
    }
  }
  const you = data?.you;
  const progress = data
    ? Math.min(100, (data.communityScore / data.communityTarget) * 100)
    : 0;
  return (
    <div className="screen-enter community-screen">
      <div
        className="social-tabs"
        role="tablist"
        aria-label="Community sections"
      >
        {[
          ["guild", "Guild"],
          ["friends", "Friends"],
          ["requests", "Friend requests"],
          ["chat", "Chat"],
        ].map(([id, label]) => (
          <button
            role="tab"
            aria-selected={socialTab === id}
            className={socialTab === id ? "selected" : ""}
            key={id}
            onClick={() => setSocialTab(id)}
          >
            {label}
          </button>
        ))}
        <button className="ghost" onClick={() => onNavigate("Shop")}>
          Skins & equipment ↗
        </button>
      </div>
      {socialTab !== "guild" && (
        <FriendsPanel
          view={socialTab}
          onView={setSocialTab}
          onJoin={() => setSocialTab("guild")}
        />
      )}
      <div hidden={socialTab !== "guild"}>
        <div className="section-heading">
          <div>
            <div className="label text-violet-300">Better together</div>
            <h2>The explorers’ guild</h2>
            <p className="muted">
              A little friendly competition. A lot of encouragement.
            </p>
          </div>
          <span className="soft-badge">
            <Users size={16} />
            {data?.totalMembers ?? 0} explorers
          </span>
        </div>
        {error && (
          <p role="alert" className="community-alert">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="save-toast">
            {notice}
          </p>
        )}
        <div className="community-banner">
          <div>
            <span className="label">Weekly community mission</span>
            <h3>Light up the constellation.</h3>
            <p>
              Every habit point brings the guild closer. Show up in your own
              way.
            </p>
            <div className="game-progress mt-5">
              <div style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>
                {data?.communityScore ?? 0} / {data?.communityTarget ?? 420}{" "}
                points
              </span>
              <b>
                {progress >= 100
                  ? "Mission complete ✦"
                  : `${Math.round(progress)}% illuminated`}
              </b>
            </div>
          </div>
          <div className="constellation" aria-hidden="true">
            <svg viewBox="0 0 250 210">
              <path d="M35 150L80 60L125 115L175 30L215 140L125 115L135 185L35 150" />
              <g>
                {[
                  [35, 150],
                  [80, 60],
                  [125, 115],
                  [175, 30],
                  [215, 140],
                  [135, 185],
                ].map(([x, y], i) => (
                  <circle
                    key={x}
                    cx={x}
                    cy={y}
                    r={i === 2 ? 13 : 7}
                    className={progress > i * 16 ? "lit" : ""}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
        {!data && !error && (
          <section className="card" role="status">
            Loading the guild…
          </section>
        )}
        {data && (
          <div className="community-layout">
            <section className="card leaderboard-card">
              <div className="flex flex-wrap justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Trophy className="text-amber-300" />
                  <h3 className="text-xl font-bold">Weekly leaderboard</h3>
                </div>
                <span className="muted text-xs">
                  {data.week} → {data.next} · Riyadh time
                </span>
              </div>
              {data.leaderboard.length === 0 ? (
                <div className="community-empty">
                  <Users size={36} />
                  <h3>Be the first explorer.</h3>
                  <p>
                    The guild is waiting for its first member. Invite friends
                    with your site link.
                  </p>
                </div>
              ) : (
                <div className="leaderboard-list">
                  {data.leaderboard.map((m) => (
                    <div
                      className={`leaderboard-row ${m.userId === data.userId ? "is-you" : ""}`}
                      key={m.userId}
                    >
                      <span className={`rank rank-${m.rank}`}>
                        {m.rank <= 3 ? "✦" : ""}
                        {m.rank}
                      </span>
                      <div className="leaderboard-avatar">
                        <Character
                          character={m.character}
                          level={m.level}
                          compact
                          interactive={false}
                        />
                      </div>
                      <div className="leaderboard-identity">
                        <b>
                          {m.alias}
                          {m.userId === data.userId && <small>You</small>}
                        </b>
                        <span>
                          {m.league} · Level {m.level}
                        </span>
                      </div>
                      <div className="leaderboard-points">
                        <b>{m.score}</b>
                        <span>points</span>
                      </div>
                      <button
                        className={`cheer-button ${m.cheered ? "cheered" : ""}`}
                        aria-label={`Cheer ${m.alias}, ${m.cheers} cheers`}
                        disabled={
                          busy ||
                          !data.member ||
                          m.userId === data.userId ||
                          m.cheered
                        }
                        onClick={() =>
                          action({ action: "cheer", toUserId: m.userId })
                        }
                      >
                        <Heart size={16} />
                        <span>{m.cheers}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="muted text-xs mt-5">
                Equal scores share a rank. Cheer once per person each week.
                Cheers don’t change scores.
              </p>
              <button
                className="ghost btn-small mt-3"
                disabled={busy}
                onClick={() => load().catch((e) => setError(e.message))}
              >
                Refresh standings
              </button>
            </section>
            <aside className="space-y-5">
              <section className="card">
                <div className="label">
                  {data.member ? "Your weekly journey" : "Join the guild"}
                </div>
                <h3 className="text-2xl font-bold mt-2">
                  {you
                    ? `${you.score} / 420 points`
                    : "Choose your explorer name"}
                </h3>
                {you && (
                  <>
                    <span className="soft-badge mt-3">
                      {you.league} league · Rank {you.rank}
                    </span>
                    <div className="score-breakdown">
                      <div>
                        <span>Training days</span>
                        <b>
                          {you.training}/3 · {you.training * 100} pts
                        </b>
                      </div>
                      <div>
                        <span>Nutrition check-ins</span>
                        <b>
                          {you.fuel}/3 · {you.fuel * 20} pts
                        </b>
                      </div>
                      <div>
                        <span>Daily coach updates</span>
                        <b>
                          {you.checkin}/3 · {you.checkin * 20} pts
                        </b>
                      </div>
                    </div>
                  </>
                )}
                <p className="muted text-sm mt-3">
                  Joining shares your alias, hero, level and weekly habit score
                  with signed-in members. Email, measurements and coach notes
                  stay private.
                </p>
                <form
                  className="mt-4 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    action({ action: "join", alias });
                  }}
                >
                  <label className="field">
                    Public alias
                    <input
                      value={alias}
                      minLength={2}
                      maxLength={24}
                      required
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder="Your explorer name"
                    />
                  </label>
                  <button className="btn w-full" disabled={busy}>
                    {busy
                      ? "Saving…"
                      : data.member
                        ? "Update alias"
                        : "Join community"}
                  </button>
                </form>
                {data.member && (
                  <button
                    className="ghost btn-small mt-3"
                    disabled={busy}
                    onClick={() => action({ action: "leave" })}
                  >
                    Leave and hide my profile
                  </button>
                )}
              </section>
              <section className="card">
                <Sparkles className="text-violet-300" />
                <h3 className="font-bold mt-3">Consistency wins.</h3>
                <p className="muted text-sm mt-2">
                  Training earns 100 points per day. Nutrition logs and daily
                  coach updates earn 20 each. Each category counts up to three
                  days per week. Rest days leave room to keep up through
                  check-ins.
                </p>
                <p className="muted text-xs mt-3">
                  Points reset every Monday. Your XP, coins and collection stay
                  with you. Skins are cosmetic and add no scoring advantage.
                </p>
                <button
                  className="ghost mt-4 flex items-center gap-2"
                  onClick={() => onNavigate("Coach")}
                >
                  Save today’s update
                  <ArrowRight size={14} />
                </button>
                <button
                  className="ghost mt-2 flex items-center gap-2"
                  onClick={() => onNavigate("Shop")}
                >
                  Explore the collection
                  <ArrowRight size={14} />
                </button>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
