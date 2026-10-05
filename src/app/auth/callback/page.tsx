"use client";
import { useEffect, useRef, useState } from "react";
import { socialBrowser } from "@/lib/social-browser";
export default function Callback() {
  const started = useRef(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  async function finish(mode: "resolve" | "create" | "link") {
    const { data } = await socialBrowser().auth.getSession();
    if (!data.session)
      throw Error("Your sign-in session expired. Please start again.");
    const r = await fetch("/api/auth/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: data.session.access_token,
        mode,
        email: email || undefined,
        password: password || undefined,
        platform: "web",
        code,
      }),
    });
    const result = await r.json();
    if (!r.ok) throw Error(result.error);
    if (result.needsOnboarding) {
      setReady(true);
      setBusy(false);
    } else {
      await socialBrowser().auth.signOut({ scope: "local" });
      window.location.replace("/");
    }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const url = new URL(window.location.href),
      code = url.searchParams.get("code");
    if (!code) {
      setError(
        url.searchParams.get("error_description") ??
          "No authorization code was returned.",
      );
      setBusy(false);
      return;
    }
    socialBrowser()
      .auth.exchangeCodeForSession(code)
      .then(async (r) => {
        if (r.error) throw r.error;
        window.history.replaceState(null, "", "/auth/callback");
        await finish("resolve");
      })
      .catch((e) => {
        setError(e.message);
        setBusy(false);
      });
  }, []);
  async function submit(mode: "create" | "link") {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await finish(mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect");
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-5">
      <section className="card w-full space-y-5">
        <h1 className="text-2xl font-bold">
          {ready ? "Keep your progress together" : "Signing you in"}
        </h1>
        {busy && <p role="status">Working…</p>}
        {error && (
          <p role="alert" className="text-rose-300">
            {error}
          </p>
        )}
        {ready && (
          <>
            <p className="muted">
              Link your existing FitLeveling account to keep its progress, or
              create a new one. We never merge accounts just because an email
              matches.
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit("link");
              }}
            >
              <label className="field">
                Existing email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="field">
                Existing password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <button className="btn w-full" disabled={busy}>
                Link existing account
              </button>
            </form>
            <label className="field">
              Invitation code for a new account
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
              />
            </label>
            <button
              className="ghost w-full"
              disabled={busy}
              onClick={() => submit("create")}
            >
              Create new account
            </button>
          </>
        )}
        <a className="muted block text-center" href="/">
          Return to sign in
        </a>
      </section>
    </main>
  );
}
