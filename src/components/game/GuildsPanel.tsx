"use client";
import { useEffect, useState } from "react";
type Guild = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  hobbies: string[];
  status: string | null;
  count?: number;
  members?: {
    userId: string;
    alias: string | null;
    status: string;
    hobbies: string[] | null;
  }[];
};
export default function GuildsPanel() {
  const [data, setData] = useState<{
      userId: string;
      list: Guild[];
      selected: Guild | null;
    }>(),
    [selected, setSelected] = useState(""),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [tags, setTags] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load() {
    const r = await fetch(
      `/api/guilds?q=${encodeURIComponent(search)}&${selected ? `id=${selected}` : ""}`,
    );
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    setData(d);
  }
  useEffect(() => {
    let active = true;
    fetch(
      `/api/guilds?q=${encodeURIComponent(search)}&${selected ? `id=${selected}` : ""}`,
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [selected, search]);
  async function action(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  const g = data?.selected,
    owner = g?.ownerId === data?.userId;
  return (
    <section className="guild-workspace">
      <h2>Closed guilds</h2>
      <p>
        Find your people. Every join request needs the guild owner’s approval.
        Choose your nickname in Leaderboard first.
      </p>
      {error && <p role="alert">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(query);
        }}
        className="interest-row"
      >
        <input
          aria-label="Search guilds"
          placeholder="Search guild names"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={80}
        />
        <button disabled={busy}>Search</button>
      </form>
      <select
        aria-label="Choose a guild"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Choose a guild</option>
        {data?.list.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name} ({x.count} members) {x.status ? `· ${x.status}` : ""}
          </option>
        ))}
      </select>
      <div className="interest-grid">
        {data?.list.map((x) => (
          <button
            className="interest-card"
            key={x.id}
            onClick={() => setSelected(x.id)}
          >
            <strong>{x.name}</strong>
            <p>{x.description}</p>
            <p>{x.hobbies.join(" · ")}</p>
            <small>🔒 Approval required · {x.count} members</small>
          </button>
        ))}
      </div>
      {data?.list.length === 0 && <p>No guilds found. Create one below.</p>}
      {g && (
        <article className="interest-card">
          <h3>{g.name}</h3>
          <p>{g.description}</p>
          <p>{g.hobbies.join(" · ")}</p>
          {!owner && (
            <button
              disabled={busy}
              onClick={() =>
                action({
                  action:
                    g.status === "pending"
                      ? "cancel"
                      : g.status === "accepted"
                        ? "leave"
                        : "apply",
                  id: g.id,
                })
              }
            >
              {g.status === "pending"
                ? "Cancel join request"
                : g.status === "accepted"
                  ? "Leave guild"
                  : "Request to join"}
            </button>
          )}
          {g.status === "pending" && (
            <p>Your request is waiting for the owner.</p>
          )}
          {owner && (
            <>
              <h4>Join requests</h4>
              {!g.members?.some((m) => m.status === "pending") && (
                <p>No pending requests.</p>
              )}
              {g.members
                ?.filter((m) => m.status === "pending")
                .map((m) => (
                  <div className="interest-row" key={m.userId}>
                    <span>{m.alias ?? "Explorer"}</span>
                    <button
                      disabled={busy}
                      onClick={() =>
                        action({
                          action: "approve",
                          id: g.id,
                          userId: m.userId,
                        })
                      }
                    >
                      Approve
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        action({ action: "reject", id: g.id, userId: m.userId })
                      }
                    >
                      Reject
                    </button>
                  </div>
                ))}
            </>
          )}
          {g.members && g.members.length > 0 && (
            <>
              <h4>Members & hobbies</h4>
              {g.members
                .filter((m) => m.status === "accepted")
                .map((m) => (
                  <div className="interest-row" key={m.userId}>
                    <span>
                      {m.alias ?? "Explorer"}
                      {m.userId === g.ownerId ? " · Owner" : ""}
                      <small>
                        {" "}
                        {m.hobbies?.join(" · ") || "No hobbies yet"}
                      </small>
                    </span>
                    {owner && m.userId !== g.ownerId && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          action({
                            action: "remove",
                            id: g.id,
                            userId: m.userId,
                          })
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
            </>
          )}
          {owner && (
            <details>
              <summary>Edit guild</summary>
              <form
                key={g.id}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  action({
                    action: "edit",
                    id: g.id,
                    name: f.get("name"),
                    description: f.get("description"),
                    hobbies: String(f.get("hobbies"))
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  });
                }}
              >
                <input
                  name="name"
                  aria-label="Guild name"
                  defaultValue={g.name}
                  required
                  minLength={2}
                  maxLength={48}
                />
                <textarea
                  name="description"
                  aria-label="Guild description"
                  defaultValue={g.description}
                  maxLength={500}
                />
                <input
                  name="hobbies"
                  aria-label="Guild hobbies"
                  defaultValue={g.hobbies.join(", ")}
                />
                <button disabled={busy}>Save guild</button>
              </form>
            </details>
          )}
        </article>
      )}
      <details>
        <summary>Create your guild</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            action({
              action: "create",
              name,
              description,
              hobbies: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            });
          }}
        >
          <label>
            Name
            <input
              required
              minLength={2}
              maxLength={48}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Hobbies (comma separated, up to 12)
            <input value={tags} onChange={(e) => setTags(e.target.value)} />
          </label>
          <button disabled={busy}>Create closed guild</button>
        </form>
      </details>
    </section>
  );
}
