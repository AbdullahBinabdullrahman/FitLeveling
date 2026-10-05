import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { getTableName } from "drizzle-orm";
const state = vi.hoisted(() => ({
  verified: true,
  mapped: false,
  insert: vi.fn(),
}));
vi.mock("@/db", () => ({
  db: {
    transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        execute: async () => {},
        select: () => ({
          from: (table: Parameters<typeof getTableName>[0]) => ({
            where: async () =>
              getTableName(table) === "auth_identities"
                ? state.mapped
                  ? [{ userId: "existing" }]
                  : []
                : [
                    {
                      id: "existing",
                      email: "person@example.com",
                      name: "Existing",
                      hasPassword: true,
                      passwordHash: "invalid",
                    },
                  ],
          }),
        }),
        insert: state.insert,
      }),
  },
}));
vi.mock("@/lib/social-auth", () => ({
  socialServer: () => ({
    auth: {
      getUser: async () => ({
        error: state.verified ? null : Error("invalid"),
        data: {
          user: state.verified
            ? {
                id: "b5b60daf-0a65-4487-80a5-988f6bcaa3e0",
                email: "person@example.com",
                email_confirmed_at: "2026-01-01",
                user_metadata: { name: "Person" },
              }
            : null,
        },
      }),
    },
  }),
}));
vi.mock("@/lib/auth", () => ({
  cookieOptions: {},
  signSession: async () => "cookie",
}));
vi.mock("@/lib/session-token", () => ({
  signMobileSession: async () => "mobile-token",
}));
import { POST } from "./route";
const request = (payload: object) =>
  new NextRequest("https://example.com/api/auth/social", {
    method: "POST",
    body: JSON.stringify({
      accessToken: "a".repeat(30),
      platform: "mobile",
      ...payload,
    }),
    headers: { "content-type": "application/json" },
  });
describe("social identity bridge", () => {
  beforeEach(() => {
    state.verified = true;
    state.mapped = false;
    state.insert.mockReset();
    process.env.REGISTRATION_CODE = "test-invitation";
  });
  it("rejects an unverified Supabase token", async () => {
    state.verified = false;
    expect((await POST(request({}))).status).toBe(400);
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("never merges an existing account just because emails match", async () => {
    const response = await POST(request({ mode: "resolve" }));
    expect(await response.json()).toEqual({ needsOnboarding: true });
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("requires the invitation for creating social accounts", async () => {
    const response = await POST(request({ mode: "create" }));
    expect(await response.json()).toEqual({
      error: "Invalid registration code",
    });
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("requires proof of the existing password for linking", async () => {
    const response = await POST(
      request({
        mode: "link",
        email: "person@example.com",
        password: "wrong-password",
      }),
    );
    expect(response.status).toBe(400);
    expect(state.insert).not.toHaveBeenCalled();
  });
  it("returns the mapped account without creating a duplicate", async () => {
    state.mapped = true;
    const response = await POST(request({ mode: "resolve" }));
    expect(await response.json()).toEqual({
      user: { id: "existing", name: "Existing", email: "person@example.com" },
      token: "mobile-token",
    });
    expect(state.insert).not.toHaveBeenCalled();
  });
});
