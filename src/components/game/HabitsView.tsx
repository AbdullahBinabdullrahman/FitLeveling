"use client";
import { useEffect, useState } from "react";
type Data = {
  day: string;
  hobbies: string[];
  habits: { id: string; name: string; done: boolean; count: number }[];
};
export default function HabitsView() {
  const [data, setData] = useState<Data>(),
    [name, setName] = useState(""),
    [tags, setTags] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const r = await fetch("/api/habits");
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setData(d);
    setTags(d.hobbies.join(", "));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function action(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      setNotice("Saved");
      setName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="guild-workspace screen-enter">
      <h2>Habits & hobbies</h2>
      <p>Small daily steps, shared interests, and room to enjoy the journey.</p>
      {error && <p role="alert">{error}</p>}
      <p role="status">{notice}</p>
      <article className="interest-card">
        <h3>Today · {data?.day}</h3>
        {data?.habits.map((h) => (
          <div className="interest-row" key={h.id}>
            <label>
              <input
                type="checkbox"
                disabled={busy}
                checked={h.done}
                onChange={() =>
                  action({ action: h.done ? "uncheck" : "check", id: h.id })
                }
              />
              {h.name}
            </label>
            <small>{h.count}/7 days</small>
            <button
              disabled={busy}
              onClick={() => action({ action: "archive", id: h.id })}
            >
              Archive
            </button>
          </div>
        ))}
        {data?.habits.length === 0 && <p>Add your first habit below.</p>}
        <form
          className="interest-row"
          onSubmit={(e) => {
            e.preventDefault();
            action({ action: "create", name });
          }}
        >
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Read 10 minutes, prepare gym bag…"
            aria-label="New habit"
          />
          <button disabled={busy}>Add habit</button>
        </form>
        <small>
          Daily checks follow your profile timezone. Habit checks do not award
          coins.
        </small>
      </article>
      <article className="interest-card">
        <h3>My hobbies</h3>
        <p>
          These interests are shared with members and owners of guilds you join.
          Up to 12 hobbies, 24 characters each.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            action({
              action: "hobbies",
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            });
          }}
        >
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            aria-label="My hobbies"
            placeholder="Gaming, hiking, photography"
          />
          <button disabled={busy}>Save hobbies</button>
        </form>
      </article>
      <h3>Tips for consistency</h3>
      <div className="interest-grid">
        {[
          "Make the first step small enough to do on a busy day.",
          "Attach a habit to something you already do, such as reading after breakfast.",
          "Prepare your workout clothes the night before.",
          "A missed day is a chance to restart tomorrow.",
          "Make time for a hobby you enjoy and invite a friend to join.",
        ].map((t) => (
          <article className="interest-card" key={t}>
            {t}
          </article>
        ))}
      </div>
    </section>
  );
}
