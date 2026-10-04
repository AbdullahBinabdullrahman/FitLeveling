import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PgDialect } from "drizzle-orm/pg-core";
import { coachMessages, profiles } from "@/db/schema";
const state = vi.hoisted(() => ({
  actor: "11111111-1111-4111-8111-111111111111",
  message: undefined as Record<string, unknown> | undefined,
  profile: { goal: "maintain" },
  updates: [] as { table: unknown; values: Record<string, unknown> }[],
}));
vi.mock("@/lib/auth", () => ({
  requireUser: async () => {
    if (!state.actor) throw Error("UNAUTHORIZED");
    return state.actor;
  },
}));
vi.mock("@/lib/training-server", () => ({ applyTraining: vi.fn() }));
vi.mock("@/db", () => ({
  db: {
    transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        insert: () => ({
          values: () => ({ onConflictDoNothing: async () => {} }),
        }),
        select: () => ({
          from: (table: unknown) => ({
            where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => ({
              for: async () => {
                if (table === profiles) return [state.profile];
                const params = new PgDialect().sqlToQuery(condition).params;
                expect(params).toContain(state.actor);
                expect(params).toContain("assistant");
                return state.message?.userId === state.actor
                  ? [state.message]
                  : [];
              },
            }),
          }),
        }),
        update: (table: unknown) => ({
          set: (values: Record<string, unknown>) => ({
            where: async () => {
              state.updates.push({ table, values });
            },
          }),
        }),
      }),
  },
}));
import { POST } from "./route";
const id = "22222222-2222-4222-8222-222222222222";
function request(action = "apply") {
  return new NextRequest("http://localhost/api/coach/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action }),
  });
}
beforeEach(() => {
  state.actor = "11111111-1111-4111-8111-111111111111";
  state.profile = { goal: "maintain" };
  state.updates = [];
  state.message = {
    id,
    userId: state.actor,
    role: "assistant",
    status: "pending",
    createdAt: new Date(),
    base: "maintain",
    proposal: { type: "goal", goal: "gain" },
  };
});
describe("Coach apply endpoint", () => {
  it("requires sign in", async () => {
    state.actor = "";
    expect((await POST(request())).status).toBe(401);
    expect(state.updates).toHaveLength(0);
  });
  it("never applies someone else’s suggestion", async () => {
    state.message!.userId = "other-user";
    expect((await POST(request())).status).toBe(404);
    expect(state.updates).toHaveLength(0);
  });
  it("applies a reviewed goal then marks its suggestion handled", async () => {
    expect((await POST(request())).status).toBe(200);
    expect(state.updates).toEqual([
      { table: profiles, values: { goal: "gain" } },
      { table: coachMessages, values: { status: "applied" } },
    ]);
  });
  it("retries a completed action without duplicate writes", async () => {
    state.message!.status = "applied";
    expect((await POST(request())).status).toBe(200);
    expect(state.updates).toHaveLength(0);
  });
  it("rejects stale snapshots without writes", async () => {
    state.profile = { goal: "lose" };
    expect((await POST(request())).status).toBe(400);
    expect(state.updates).toHaveLength(0);
  });
  it("rejects expired apply but still allows dismissal", async () => {
    state.message!.createdAt = new Date(0);
    expect((await POST(request())).status).toBe(400);
    expect(state.updates).toHaveLength(0);
    expect((await POST(request("dismiss"))).status).toBe(200);
    expect(state.updates).toEqual([
      { table: coachMessages, values: { status: "dismissed" } },
    ]);
  });
});
