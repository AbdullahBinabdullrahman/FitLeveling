"use client";
import { useState } from "react";
import { socialBrowser, socialConfigured } from "@/lib/social-browser";
export default function SocialSignIn() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!socialConfigured) return null;
  return (
    <div className="space-y-3">
      <p className="muted text-center text-sm">Or continue with</p>
      <div className="flex gap-3">
        {(["google", "apple"] as const).map((provider) => (
          <button
            type="button"
            className="ghost grow"
            disabled={busy}
            key={provider}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const { error } = await socialBrowser().auth.signInWithOAuth({
                  provider,
                  options: {
                    redirectTo: window.location.origin + "/auth/callback",
                  },
                });
                if (error) throw error;
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not sign in");
                setBusy(false);
              }
            }}
          >
            {provider === "google" ? "Google" : "Apple"}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
