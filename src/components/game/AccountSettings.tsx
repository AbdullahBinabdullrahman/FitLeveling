"use client";
import { useEffect, useState } from "react";
type Account = { id: string; name: string; email: string; timezone: string };
export default function AccountSettings({
  onSaved,
}: {
  onSaved: (user: Account) => void;
}) {
  const [form, setForm] = useState<Account>(),
    [password, setPassword] = useState(""),
    [nextPassword, setNextPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/account")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        if (active)
          setForm({ ...d.user, timezone: d.user.timezone ?? "Asia/Riyadh" });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <section className="card mb-5">
      <h2 className="text-2xl font-bold">Account settings</h2>
      <p className="muted mb-4">
        Manage your account and the timezone used for daily habits and logs.
      </p>
      {error && (
        <p role="alert" className="text-rose-300">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-teal-300">
          {notice}
        </p>
      )}
      {!form ? (
        <p>Loading account…</p>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            setNotice("");
            try {
              const r = await fetch("/api/account", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...form,
                  ...(password ? { currentPassword: password } : {}),
                  ...(nextPassword ? { newPassword: nextPassword } : {}),
                }),
              });
              const d = await r.json();
              if (!r.ok) throw Error(d.error);
              setForm(d.user);
              setPassword("");
              setNextPassword("");
              onSaved(d.user);
              setNotice("Account saved.");
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not save");
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy} className="grid gap-4 md:grid-cols-2">
            <label className="field">
              Name
              <input
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="field">
              Email
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="field">
              Timezone
              <input
                required
                list="account-timezones"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              />
              <datalist id="account-timezones">
                {[
                  "Asia/Riyadh",
                  "Asia/Dubai",
                  "Europe/London",
                  "America/New_York",
                  "UTC",
                ].map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>
            <label className="field">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                maxLength={200}
                onChange={(e) => setPassword(e.target.value)}
              />
              <small>Required when changing email or password.</small>
            </label>
            <label className="field">
              New password (optional)
              <input
                type="password"
                autoComplete="new-password"
                minLength={10}
                maxLength={200}
                value={nextPassword}
                onChange={(e) => setNextPassword(e.target.value)}
              />
            </label>
            <button className="btn self-end">
              {busy ? "Saving…" : "Save account"}
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
