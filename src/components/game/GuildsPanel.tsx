"use client";
import { useEffect, useState, useRef } from "react";
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
export default function GuildsPanel({ onJoin }: { onJoin: () => void }) {
  const inFlight = useRef(false);
  const createAttempt = useRef<{ signature: string; id: string } | null>(null);
  const [data, setData] = useState<{
      userId: string;
      list: Guild[];
      mine: Guild[];
      member: { alias: string } | null;
      selected: Guild | null;
    }>(),
    [selected, setSelected] = useState(""),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [name, setName] = useState(""),
    [description, setDescription] = useState(""),
    [tags, setTags] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [alias, setAlias] = useState("");
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
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await fetch("/api/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (d.guildId) {
        setSearch("");
        setQuery("");
        setSelected(d.guildId);
        setName("");
        setDescription("");
        setTags("");
        createAttempt.current = null;
        setNotice(
          "Guild created. You are the owner. New members need your approval.",
        );
      } else {
        setNotice("Guild updated.");
        try {
          await load();
        } catch {
          setNotice("Saved. Refresh to load the latest guild details.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const g = data?.selected?.id === selected ? data.selected : null,
    owner = g?.ownerId === data?.userId;
  return (
    <section className="guild-workspace">
      <h2>Closed guilds</h2>
      <p>
        Find your people. Every join request needs the guild owner’s approval.
        Create a guild below or send a join request to one that fits your
        interests.
      </p>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Loading guilds…</p>}
      {data && !data.member && (
        <p>
          Choose your public nickname when creating a guild, or{" "}
          <button type="button" className="ghost" onClick={onJoin}>
            Join the community to send requests
          </button>
          .
        </p>
      )}
      {!!data?.mine.length && (
        <div>
          <h3>My guilds & requests</h3>
          <div className="interest-grid">
            {data.mine.map((x) => (
              <button
                type="button"
                className="interest-card"
                disabled={busy}
                key={x.id}
                onClick={() => setSelected(x.id)}
              >
                <strong>{x.name}</strong>
                <small>
                  {x.ownerId === data.userId
                    ? "Owner · Manage join requests"
                    : x.status === "pending"
                      ? "Waiting for approval"
                      : "Member"}
                </small>
              </button>
            ))}
          </div>
        </div>
      )}
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
        disabled={busy}
        aria-label="Choose a guild"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Choose a guild</option>
        {data?.selected &&
          !data.list.some((g) => g.id === data.selected?.id) && (
            <option value={data.selected.id}>{data.selected.name}</option>
          )}
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
            disabled={busy}
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
            const draft = {
              action: "create",
              name,
              description,
              hobbies: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              ...(data?.member ? {} : { alias }),
            };
            const signature = JSON.stringify(draft);
            if (createAttempt.current?.signature !== signature)
              createAttempt.current = { signature, id: crypto.randomUUID() };
            action({ ...draft, createId: createAttempt.current.id });
          }}
        >
          <fieldset disabled={busy || !data} className="space-y-3">
            {data && !data.member && (
              <label>
                Public nickname
                <input
                  required
                  minLength={2}
                  maxLength={24}
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="How other members know you"
                />
                <small>
                  Creating your guild also joins the public community using this
                  nickname.
                </small>
              </label>
            )}
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
            <button disabled={busy || !data}>
              {busy ? "Creating…" : "Create closed guild"}
            </button>
          </fieldset>
        </form>
      </details>
    </section>
  );
}
