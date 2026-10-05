import { DEMO, demoUser, resetDemo } from "./demo";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { api, setToken } from "./api";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { unregisterPush, cancelReminders } from "./notifications";
WebBrowser.maybeCompleteAuthSession();
export type User = { id: string; name: string; email: string };
type Session = { user: User; token: string };
const Context = createContext<{
  user: User | null;
  loading: boolean;
  socialPending: boolean;
  login: (
    email: string,
    password: string,
    signup?: { name: string; code: string },
  ) => Promise<void>;
  social: (provider: "google" | "apple") => Promise<void>;
  completeSocial: (code: string) => Promise<void>;
  finishSocial: (
    mode: "create" | "link",
    email?: string,
    password?: string,
    code?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}>({} as never);
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }: { children: ReactNode }) {
  const cache = useQueryClient();
  const [user, setUser] = useState<User | null>(DEMO ? demoUser : null),
    [loading, setLoading] = useState(!DEMO),
    [socialPending, setPending] = useState(false);
  async function accept(s: Session) {
    await storage.setItem("fit-session", JSON.stringify(s));
    setToken(s.token);
    setUser(s.user);
    setPending(false);
  }
  useEffect(() => {
    if (DEMO) return;
    let active = true;
    storage
      .getItem("fit-session")
      .then(async (value) => {
        if (!value) return;
        const s: Session = JSON.parse(value);
        setToken(s.token);
        try {
          const d = await api<{ user: User | null }>("auth");
          if (!d.user) {
            await storage.removeItem("fit-session");
            setToken(null);
          } else if (active) setUser(d.user);
        } catch {
          if (active) setUser(s.user);
        }
      })
      .catch(() => {
        setToken(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const sub = AppState.addEventListener("change", (state) => {
      if (Platform.OS !== "web") {
        if (state === "active") supabase?.auth.startAutoRefresh();
        else supabase?.auth.stopAutoRefresh();
      }
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  async function exchange(
    mode: "resolve" | "create" | "link",
    email?: string,
    password?: string,
    code?: string,
  ) {
    const { data } = await supabase!.auth.getSession();
    if (!data.session) throw Error("Social session expired. Sign in again.");
    const result = await api<Session & { needsOnboarding?: boolean }>(
      "auth/social",
      "POST",
      {
        accessToken: data.session.access_token,
        mode,
        email,
        password,
        code,
        platform: "mobile",
      },
    );
    if (result.needsOnboarding) setPending(true);
    else await accept(result);
  }
  async function completeSocial(code: string) {
    if (!supabase) throw Error("Social sign-in has not been configured yet.");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    await exchange("resolve");
  }
  async function social(provider: "google" | "apple") {
    if (!supabase)
      throw Error(
        "Google and Apple sign-in need your Supabase configuration first.",
      );
    const redirectTo = Linking.createURL("auth/callback", {
      scheme: "fitleveling",
    });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw Error("No sign-in link was returned");
    if (Platform.OS === "web") {
      window.location.assign(data.url);
      return;
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success") {
      const callback = new URL(result.url),
        code = callback.searchParams.get("code");
      if (callback.searchParams.get("error"))
        throw Error(
          callback.searchParams.get("error_description") ??
            "Sign-in was declined",
        );
      if (!code) throw Error("Sign-in did not return an authorization code");
      await completeSocial(code);
    }
  }
  return (
    <Context.Provider
      value={{
        user,
        loading,
        socialPending,
        login: async (email, password, signup) =>
          accept(
            await api<Session>("mobile/auth", "POST", {
              email,
              password,
              ...signup,
            }),
          ),
        social,
        completeSocial,
        finishSocial: async (mode, email, password, code) =>
          exchange(mode, email, password, code),
        logout: async () => {
          if (DEMO) {
            resetDemo();
            cache.clear();
            setUser({ ...demoUser });
            return;
          }
          try {
            await unregisterPush();
          } catch {}
          try {
            await cancelReminders();
          } catch {}
          try {
            await supabase?.auth.signOut();
          } catch {}
          await storage.removeItem("fit-session");
          setToken(null);
          setUser(null);
          setPending(false);
          cache.clear();
          await storage.removeItem("fit-preferences");
        },
        updateUser: (next) => {
          setUser(next);
          storage
            .getItem("fit-session")
            .then((s) => {
              if (s)
                return storage.setItem(
                  "fit-session",
                  JSON.stringify({ ...JSON.parse(s), user: next }),
                );
            })
            .catch(() => {});
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
