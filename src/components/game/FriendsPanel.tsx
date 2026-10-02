"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, UserPlus, Search, Send, ShieldBan } from "lucide-react";
type Connection = {
  id: string;
  userId: string;
  alias: string;
  status: string;
  incoming: boolean;
  unread: number;
};
type Social = {
  userId: string;
  joined: boolean;
  connections: Connection[];
  people: { userId: string; alias: string }[];
};
type Message = {
  id: number;
  senderId: string;
  body: string;
  createdAt: string;
};
export default function FriendsPanel({
  view,
  onView,
  onJoin,
}: {
  view: string;
  onView: (v: string) => void;
  onJoin: () => void;
}) {
  const [data, setData] = useState<Social>(),
    [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [sending, setSending] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [more, setMore] = useState(true);
  const attempt = useRef<{ body: string; clientId: string } | null>(null),
    bottom = useRef<HTMLDivElement>(null),
    active = useRef<string | null>(null),
    drafts = useRef<Record<string, string>>({});
  async function api(
    path: string,
    method = "GET",
    body?: unknown,
    signal?: AbortSignal,
  ) {
    const res = await fetch("/api/" + path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error ?? "Request failed");
    return d;
  }
  useEffect(() => {
    const abort = new AbortController();
    let live = true;
    async function refresh() {
      if (document.hidden) return;
      try {
        const d = await api(
          "friends" + (search ? "?q=" + encodeURIComponent(search) : ""),
          "GET",
          undefined,
          abort.signal,
        );
        if (live) setData(d);
      } catch (e) {
        if (live)
          setError(e instanceof Error ? e.message : "Could not load friends");
      }
    }
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => {
      live = false;
      abort.abort();
      clearInterval(timer);
    };
  }, [search]);
  const friends =
      data?.connections.filter((c) => c.status === "accepted") ?? [],
    requests = data?.connections.filter((c) => c.status === "pending") ?? [],
    blocked = data?.connections.filter((c) => c.status === "blocked") ?? [];
  const contact = friends.find((c) => c.id === selected);
  useEffect(() => {
    if (
      data &&
      selected &&
      !data.connections.some(
        (c) => c.id === selected && c.status === "accepted",
      )
    )
      setSelected(null);
  }, [data, selected]);
  useEffect(() => {
    active.current = selected;
    setMessages([]);
    setMore(true);
    setDraft(selected ? (drafts.current[selected] ?? "") : "");
    attempt.current = null;
    if (!selected) return;
    const abort = new AbortController();
    let live = true;
    async function refresh() {
      if (document.hidden) return;
      try {
        const d = await api(
          "messages?friendshipId=" + selected,
          "GET",
          undefined,
          abort.signal,
        );
        if (!live) return;
        setMessages((old) =>
          Array.from(
            new Map(
              [...old, ...d.messages].map((m: Message) => [m.id, m]),
            ).values(),
          ).sort((a, b) => a.id - b.id),
        );
        if (d.messages.length) {
          await api(
            "messages",
            "PATCH",
            {
              friendshipId: selected,
              lastMessageId: d.messages[d.messages.length - 1].id,
            },
            abort.signal,
          );
          if (live)
            setData(
              (old) =>
                old && {
                  ...old,
                  connections: old.connections.map((c) =>
                    c.id === selected ? { ...c, unread: 0 } : c,
                  ),
                },
            );
        }
      } catch (e) {
        if (live)
          setError(e instanceof Error ? e.message : "Could not load chat");
      }
    }
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => {
      live = false;
      abort.abort();
      clearInterval(timer);
    };
  }, [selected]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [messages.at(-1)?.id]);
  async function act(body: unknown) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("friends", "POST", body);
      const d = await api(
        "friends" + (search ? "?q=" + encodeURIComponent(search) : ""),
      );
      setData(d);
      setNotice("Updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update friendship");
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    const body = draft.trim();
    const conversation = selected;
    if (!body || sending || !conversation) return;
    setSending(true);
    setError("");
    if (attempt.current?.body !== body)
      attempt.current = { body, clientId: crypto.randomUUID() };
    try {
      const d = await api("messages", "POST", {
        friendshipId: conversation,
        ...attempt.current,
      });
      if (active.current === conversation) {
        setMessages((old) =>
          [...old.filter((m) => m.id !== d.message.id), d.message].sort(
            (a, b) => a.id - b.id,
          ),
        );
        setDraft("");
        drafts.current[conversation] = "";
        attempt.current = null;
      }
    } catch (e) {
      if (active.current === conversation)
        setError(e instanceof Error ? e.message : "Message not sent");
    } finally {
      setSending(false);
    }
  }
  function open(c: Connection) {
    setSelected(c.id);
    onView("chat");
    setError("");
  }
  async function older() {
    if (!selected || !messages.length) return;
    const conversation = selected;
    setBusy(true);
    try {
      const d = await api(
        "messages?friendshipId=" + conversation + "&before=" + messages[0].id,
      );
      if (active.current === conversation) {
        setMessages((old) =>
          Array.from(
            new Map(
              [...d.messages, ...old].map((m: Message) => [m.id, m]),
            ).values(),
          ).sort((a, b) => a.id - b.id),
        );
        setMore(d.messages.length === 50);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="social-workspace">
      {error && (
        <p className="community-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="save-toast" role="status">
          {notice}
        </p>
      )}
      {!data ? (
        <div className="card" role="status">
          Loading your connections…
        </div>
      ) : (
        <>
          <div className="social-summary">
            <span>{friends.length} friends</span>
            <span>
              {requests.filter((r) => r.incoming).length} incoming requests
            </span>
            <span>
              {friends.reduce((n, c) => n + c.unread, 0)} unread messages
            </span>
          </div>
          {!data.joined && (
            <section className="card mb-5">
              <h3 className="font-bold">
                Choose a community alias to be discoverable
              </h3>
              <p className="muted mt-2">
                Join the guild to find explorers and send requests. Existing
                friends and chats remain available.
              </p>
              <button className="btn mt-4" onClick={onJoin}>
                Join the guild
              </button>
            </section>
          )}
          {view === "friends" && (
            <div className="social-columns">
              <section className="card">
                <h3 className="font-bold text-xl mb-4">Your friends</h3>
                {!friends.length && (
                  <p className="muted">
                    Find an explorer and send your first request. Chat unlocks
                    when they accept.
                  </p>
                )}
                {friends.map((c) => (
                  <div className="friend-row" key={c.id}>
                    <span className="friend-avatar">
                      {c.alias.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="grow">
                      <b>{c.alias}</b>
                      {c.unread > 0 && (
                        <span className="soft-badge ml-2">
                          {c.unread} unread
                        </span>
                      )}
                    </div>
                    <button className="ghost btn-small" onClick={() => open(c)}>
                      <MessageCircle size={15} /> Chat
                    </button>
                    <details className="friend-menu">
                      <summary aria-label={`Options for ${c.alias}`}>
                        •••
                      </summary>
                      <button
                        disabled={busy}
                        onClick={() =>
                          act({ action: "remove", friendshipId: c.id })
                        }
                      >
                        Remove friend
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          act({ action: "block", friendshipId: c.id })
                        }
                      >
                        Block
                      </button>
                    </details>
                  </div>
                ))}
              </section>
              <section className="card">
                <h3 className="text-xl font-bold">Find explorers</h3>
                <p className="muted text-sm mt-2">
                  Search public aliases. No emails or private profile details
                  are shared.
                </p>
                <form
                  className="friend-search mt-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSearch(query.trim());
                  }}
                >
                  <label className="sr-only" htmlFor="explorer-search">
                    Explorer alias
                  </label>
                  <input
                    id="explorer-search"
                    value={query}
                    minLength={2}
                    maxLength={50}
                    placeholder="At least 2 characters"
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button
                    className="btn"
                    disabled={!data.joined || query.trim().length < 2}
                  >
                    <Search size={16} />
                    <span className="sr-only">Search</span>
                  </button>
                </form>
                {data.people.map((p) => {
                  const connection = data.connections.find(
                    (c) => c.userId === p.userId,
                  );
                  return (
                    <div className="friend-row" key={p.userId}>
                      <b className="grow">{p.alias}</b>
                      <button
                        className="ghost btn-small"
                        disabled={busy || !!connection}
                        onClick={() =>
                          act({ action: "request", toUserId: p.userId })
                        }
                      >
                        {connection ? (
                          connection.status === "accepted" ? (
                            "Friends"
                          ) : connection.incoming ? (
                            "Incoming request"
                          ) : (
                            "Request sent"
                          )
                        ) : (
                          <>
                            <UserPlus size={14} /> Add friend
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
                {search && !data.people.length && (
                  <p className="muted text-sm mt-4">
                    No matching explorers found.
                  </p>
                )}
                {blocked.length > 0 && (
                  <details className="mt-5">
                    <summary>Blocked explorers · {blocked.length}</summary>
                    {blocked.map((c) => (
                      <div className="friend-row" key={c.id}>
                        <ShieldBan size={16} />
                        <span className="grow">{c.alias}</span>
                        <button
                          className="ghost btn-small"
                          disabled={busy}
                          onClick={() =>
                            act({ action: "unblock", friendshipId: c.id })
                          }
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </details>
                )}
              </section>
            </div>
          )}
          {view === "requests" && (
            <section className="card">
              <h3 className="text-xl font-bold">Friend requests</h3>
              <p className="muted text-sm mt-2 mb-5">
                Accept requests to enable private messages.
              </p>
              {!requests.length && (
                <p className="muted">
                  No pending requests. Find explorers in Friends.
                </p>
              )}
              {requests.map((c) => (
                <div className="friend-row" key={c.id}>
                  <span className="friend-avatar">
                    {c.alias.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="grow">
                    <b>{c.alias}</b>
                    <p className="muted text-xs">
                      {c.incoming
                        ? "Wants to be your friend"
                        : "Waiting for a response"}
                    </p>
                  </div>
                  {c.incoming ? (
                    <>
                      <button
                        className="btn btn-small"
                        disabled={busy}
                        onClick={() =>
                          act({ action: "accept", friendshipId: c.id })
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="ghost btn-small"
                        disabled={busy}
                        onClick={() =>
                          act({ action: "decline", friendshipId: c.id })
                        }
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    <button
                      className="ghost btn-small"
                      disabled={busy}
                      onClick={() =>
                        act({ action: "cancel", friendshipId: c.id })
                      }
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              ))}
            </section>
          )}
          {view === "chat" && (
            <div className="social-chat-layout">
              <aside className="card">
                <h3 className="font-bold mb-4">Conversations</h3>
                {!friends.length && (
                  <p className="muted text-sm">
                    Accepted friends will appear here.
                  </p>
                )}
                {friends.map((c) => (
                  <button
                    className={`conversation-button ${c.id === selected ? "selected" : ""}`}
                    key={c.id}
                    onClick={() => open(c)}
                  >
                    <span>{c.alias}</span>
                    {c.unread > 0 && (
                      <span className="soft-badge">{c.unread}</span>
                    )}
                  </button>
                ))}
              </aside>
              <section className="chat-card friend-chat">
                {contact ? (
                  <>
                    <div className="chat-header">
                      <b>{contact.alias}</b>
                      <span className="muted text-xs">
                        Private conversation
                      </span>
                    </div>
                    <div
                      className="chat-messages"
                      role="log"
                      aria-label={`Chat with ${contact.alias}`}
                      aria-live="polite"
                    >
                      {!!messages.length && more && (
                        <button
                          className="ghost btn-small"
                          disabled={busy}
                          onClick={older}
                        >
                          Load earlier messages
                        </button>
                      )}
                      {!messages.length && (
                        <p className="muted text-center mt-8">
                          Say hello or celebrate a small win together.
                        </p>
                      )}
                      {messages.map((m) => (
                        <div
                          className={`chat-message ${m.senderId === data.userId ? "user" : "assistant"}`}
                          key={m.id}
                        >
                          <p>{m.body}</p>
                          <time
                            className="muted text-xs"
                            dateTime={m.createdAt}
                          >
                            {new Date(m.createdAt).toLocaleString()}
                          </time>
                        </div>
                      ))}
                      <div ref={bottom} />
                    </div>
                    <form
                      className="chat-input"
                      onSubmit={(e) => {
                        e.preventDefault();
                        send();
                      }}
                    >
                      <label className="sr-only" htmlFor="friend-message">
                        Message {contact.alias}
                      </label>
                      <input
                        id="friend-message"
                        maxLength={2000}
                        value={draft}
                        disabled={sending}
                        onChange={(e) => {
                          setDraft(e.target.value);
                          drafts.current[selected!] = e.target.value;
                        }}
                        placeholder="Write a message…"
                      />
                      <button
                        className="btn"
                        disabled={sending || !draft.trim()}
                        aria-label="Send message"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                    <p className="chat-footnote">
                      Messages refresh every five seconds. Blocking or removing
                      a friend disables chat.
                    </p>
                  </>
                ) : (
                  <div className="community-empty">
                    <MessageCircle size={36} />
                    <h3>Pick a friend to start chatting</h3>
                    <p>Only accepted friends can send you messages.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </>
      )}
    </section>
  );
}
