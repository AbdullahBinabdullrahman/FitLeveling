import { beforeEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { PgDialect } from "drizzle-orm/pg-core";
import { profiles, guilds, guildMembers, communityProfiles } from "@/db/schema";
const state = vi.hoisted(() => ({
  actor: "11111111-1111-4111-8111-111111111111",
  guilds: [] as Record<string, unknown>[],
  members: [] as Record<string, unknown>[],
  community: [] as Record<string, unknown>[],
  profileLocked: false,
  failMembership: false,
}));
vi.mock("@/lib/auth", () => ({
  requireUser: async () => {
    if (!state.actor) throw Error("UNAUTHORIZED");
    return state.actor;
  },
}));
vi.mock("@/db", () => ({
  db: {
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const backup = {
        guilds: structuredClone(state.guilds),
        members: structuredClone(state.members),
        community: structuredClone(state.community),
      };
      const tx = {
        select: () => ({
          from: (table: unknown) => ({
            where: (condition: Parameters<PgDialect["sqlToQuery"]>[0]) => {
              const { sql, params } = new PgDialect().sqlToQuery(condition);
              const rows =
                table === profiles
                  ? [{ userId: state.actor }]
                  : table === guilds
                    ? state.guilds.filter((g) =>
                        sql.includes('"owner_id"')
                          ? g.ownerId === params[0]
                          : g.id === params[0],
                      )
                    : table === communityProfiles
                      ? state.community.filter((c) => c.userId === params[0])
                      : state.members.filter(
                          (m) =>
                            m.guildId === params[0] && m.userId === params[1],
                        );
              return {
                then: (resolve: (rows: Record<string, unknown>[]) => void) =>
                  resolve(rows),
                for: async () => {
                  if (table === profiles) state.profileLocked = true;
                  return rows;
                },
              };
            },
          }),
        }),
        insert: (table: unknown) => ({
          values: (value: Record<string, unknown>) => {
            const save = () => {
              if (table === profiles) return;
              if (table === guildMembers && state.failMembership)
                throw Error("Simulated insert failure");
              (table === guilds
                ? state.guilds
                : table === guildMembers
                  ? state.members
                  : state.community
              ).push({ ...value });
            };
            return {
              then: (resolve: () => void) => {
                save();
                resolve();
              },
              returning: async () => {
                save();
                return [value];
              },
              onConflictDoNothing: async () => {
                save();
              },
              onConflictDoUpdate: async () => {
                save();
              },
            };
          },
        }),
      };
      try {
        return await fn(tx);
      } catch (e) {
        state.guilds = backup.guilds;
        state.members = backup.members;
        state.community = backup.community;
        throw e;
      }
    },
  },
}));
import { POST } from "./route";
const id = "22222222-2222-4222-8222-222222222222";
function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/guilds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
const draft = {
  action: "create",
  createId: id,
  name: "Hiking crew",
  description: "Weekend walks",
  hobbies: ["Hiking"],
  alias: "Explorer",
};
beforeEach(() => {
  state.actor = "11111111-1111-4111-8111-111111111111";
  state.guilds = [];
  state.members = [];
  state.community = [];
  state.profileLocked = false;
  state.failMembership = false;
});
describe("Guild creation API", () => {
  it("requires sign in", async () => {
    state.actor = "";
    expect((await POST(request(draft))).status).toBe(401);
    expect(state.guilds).toHaveLength(0);
  });
  it("creates a closed guild with its owner accepted and an inline nickname", async () => {
    const r = await POST(request(draft));
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, guildId: id });
    expect(state.profileLocked).toBe(true);
    expect(state.guilds).toHaveLength(1);
    expect(state.members).toEqual([
      { guildId: id, userId: state.actor, status: "accepted" },
    ]);
    expect(state.community).toEqual([
      { userId: state.actor, alias: "Explorer" },
    ]);
  });
  it("retries the same create without a duplicate guild or membership", async () => {
    await POST(request(draft));
    expect((await POST(request(draft))).status).toBe(200);
    expect(state.guilds).toHaveLength(1);
    expect(state.members).toHaveLength(1);
  });
  it("preserves an existing nickname", async () => {
    state.community = [{ userId: state.actor, alias: "Original" }];
    const { alias, ...body } = draft;
    expect((await POST(request(body))).status).toBe(200);
    expect(state.community[0].alias).toBe("Original");
  });
  it("asks for a nickname when there is none", async () => {
    const { alias, ...body } = draft;
    expect((await POST(request(body))).status).toBe(400);
    expect(state.guilds).toHaveLength(0);
  });
  it("enforces the owner limit while allowing completed request retries", async () => {
    state.community = [{ userId: state.actor, alias: "Explorer" }];
    state.guilds = Array.from({ length: 3 }, (_, i) => ({
      id: `existing-${i}`,
      ownerId: state.actor,
      name: `Guild ${i}`,
    }));
    expect((await POST(request(draft))).status).toBe(400);
    expect(state.guilds).toHaveLength(3);
    state.guilds[0].id = id;
    expect((await POST(request(draft))).status).toBe(200);
    expect(state.guilds).toHaveLength(3);
  });
  it("cannot reuse another owner’s guild ID", async () => {
    state.guilds = [{ id, ownerId: "other", name: "Other" }];
    expect((await POST(request(draft))).status).toBe(404);
    expect(state.members).toHaveLength(0);
  });
  it("rolls back guild and nickname if owner membership cannot be saved", async () => {
    state.failMembership = true;
    expect((await POST(request(draft))).status).toBe(400);
    expect(state.guilds).toHaveLength(0);
    expect(state.community).toHaveLength(0);
  });
  it("prevents duplicate names for the same owner even with a new request ID", async () => {
    await POST(request(draft));
    expect(
      (
        await POST(
          request({
            ...draft,
            createId: "33333333-3333-4333-8333-333333333333",
            name: "HIKING CREW",
          }),
        )
      ).status,
    ).toBe(400);
    expect(state.guilds).toHaveLength(1);
  });
  it("rejects invalid names and missing retry IDs", async () => {
    expect((await POST(request({ ...draft, name: " " }))).status).toBe(400);
    const { createId, ...body } = draft;
    expect((await POST(request(body))).status).toBe(400);
    expect(state.guilds).toHaveLength(0);
  });
  it("new applicants remain pending and repeats do not add requests", async () => {
    state.guilds = [{ id, ownerId: "owner", name: "Owner guild" }];
    state.community = [{ userId: state.actor, alias: "Explorer" }];
    expect((await POST(request({ action: "apply", id }))).status).toBe(200);
    expect(state.members).toEqual([
      { guildId: id, userId: state.actor, status: "pending" },
    ]);
    state.members[0].status = "pending";
    expect((await POST(request({ action: "apply", id }))).status).toBe(200);
    expect(state.members).toHaveLength(1);
  });
});
