import { COSMETICS } from "./cosmetics";
import type {
  Game,
  Workout,
  Guild,
  Friend,
  CoachMessage,
  Item,
  Profile,
} from "./types";
export const DEMO = process.env.EXPO_PUBLIC_DEMO === "1";
export const demoUser = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Abady Demo",
  email: "explorer@example.invalid",
};
const today = new Date().toLocaleDateString("en-CA"),
  self = demoUser.id,
  sara = "22222222-2222-4222-8222-222222222222",
  khalid = "33333333-3333-4333-8333-333333333333";
const catalog: Item[] = COSMETICS;

const profile: Profile = {
  heightCm: "178",
  currentWeightKg: "78.4",
  birthYear: 1995,
  sexForEstimate: "male",
  activityFactor: "1.5",
  goal: "gain",
  calorieTarget: 2450,
  proteinMin: 140,
  proteinMax: 165,
  timezone: "Asia/Riyadh",
};
function seed() {
  return {
    user: { ...demoUser, timezone: "Asia/Riyadh", hasPassword: true },
    game: {
      character: {
        name: "Nova",
        archetype: "vanguard",
        color: "mint",
        accessory: "cape",
        animations: true,
        skin: "glacier",
        weapon: "ionblade",
        aura: "starlight",
        trinket: "starvisor",
        vfx: "embertrail",
      },
      stats: {
        level: 12,
        coins: 1250,
        weeklyWorkouts: 3,
        todayWorkouts: 0,
        nutritionDays: 4,
        lifetimeXp:
          Array.from({ length: 11 }, (_, i) =>
            Math.round(100 * (i + 1) ** 1.35),
          ).reduce((sum, n) => sum + n, 0) + 1000,
      },
      today,
      timezone: "Asia/Riyadh",
      days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 6 + i);
        return {
          day: d.toLocaleDateString("en-CA"),
          trained: [0, 2, 4].includes(i),
          fueled: [0, 1, 2, 4].includes(i),
        };
      }),
      quests: [
        {
          id: "weekly-fuel",
          title: "Fuel your adventure",
          description: "Log nutrition on three days this week.",
          kind: "weekly",
          current: 3,
          target: 3,
          xp: 80,
          coins: 20,
          claimed: false,
          eventKey: "demo-fuel",
        },
        {
          id: "workouts-10",
          title: "The first ten missions",
          description: "Complete ten workouts across your journey.",
          kind: "achievement",
          current: 8,
          target: 10,
          xp: 150,
          coins: 30,
          claimed: false,
          eventKey: "demo-ten",
        },

        {
          id: "weekly-boss",
          title: "The Consistency Guardian",
          description:
            "Train on three different days to break the guardian’s shields.",
          kind: "weekly",
          current: 3,
          target: 3,
          xp: 250,
          coins: 75,
          claimed: false,
          eventKey: "demo-boss",
        },
        {
          id: "demo-training",
          title: "Show up for yourself",
          description: "Finish today’s training. A little progress counts.",
          kind: "daily",
          current: 0,
          target: 1,
          xp: 100,
          coins: 25,
          claimed: false,
          eventKey: "demo-training",
        },
        {
          id: "demo-habit",
          title: "Build your rhythm",
          description: "You completed your daily habit. Collect your reward.",
          kind: "daily",
          current: 1,
          target: 1,
          xp: 30,
          coins: 10,
          claimed: false,
          eventKey: "demo-habit",
        },
      ],
    } as Game,
    workout: {
      profile: { ...profile },
      active: null,
      activeSets: [],
      plan: [
        {
          templateId: "upper",
          templateName: "Upper body · Strength",
          exerciseId: "bench",
          exerciseName: "Bench press",
          sets: 3,
          repMin: 8,
          repMax: 12,
        },
        {
          templateId: "upper",
          templateName: "Upper body · Strength",
          exerciseId: "row",
          exerciseName: "Cable row",
          sets: 3,
          repMin: 10,
          repMax: 12,
        },
        {
          templateId: "lower",
          templateName: "Lower body · Strength",
          exerciseId: "squat",
          exerciseName: "Squat",
          sets: 3,
          repMin: 8,
          repMax: 10,
        },
      ],
    } as Workout,
    owned: ["glacier", "ionblade", "starlight", "starvisor", "embertrail"],
    friends: [
      {
        id: "friend-sara",
        userId: sara,
        alias: "SaraMoves",
        status: "accepted",
        incoming: false,
        unread: 1,
      },
      {
        id: "friend-khalid",
        userId: khalid,
        alias: "KhalidFit",
        status: "pending",
        incoming: true,
        unread: 0,
      },
    ] as Friend[],
    guilds: [
      {
        id: "guild-crew",
        ownerId: self,
        name: "The Consistency Crew",
        description:
          "A closed guild for people who show up, encourage each other, and keep growing.",
        hobbies: ["Strength training", "Hiking", "Gaming"],
        status: "accepted",
        count: 2,
        members: [
          {
            userId: self,
            alias: "Nova",
            status: "accepted",
            hobbies: ["Strength training", "Gaming"],
          },
          {
            userId: sara,
            alias: "SaraMoves",
            status: "accepted",
            hobbies: ["Calisthenics", "Hiking"],
          },
          {
            userId: khalid,
            alias: "KhalidFit",
            status: "pending",
            hobbies: [],
          },
        ],
      },
      {
        id: "guild-outdoors",
        ownerId: sara,
        name: "Weekend Explorers",
        description: "Hikes, calisthenics and a little fresh air.",
        hobbies: ["Hiking", "Calisthenics"],
        status: null,
        count: 8,
        members: [],
      },
    ] as Guild[],
    messages: [
      {
        id: 1,
        friendshipId: "friend-sara",
        senderId: sara,
        body: "Ready for our next workout? Your new skin looks great ✨",
        createdAt: new Date().toISOString(),
      },
    ],
    coach: [
      {
        id: "intro",
        role: "assistant",
        content:
          "Hey Abady! How are you feeling today? We can talk through your training, nutrition, or anything you want to change. Try “adjust my exercises” or “review nutrition”.",
        proposal: null,
        status: "none",
      },
    ] as CoachMessage[],
    habits: [
      {
        id: "water",
        name: "Drink a glass of water after waking",
        done: true,
        count: 5,
      },
      { id: "walk", name: "Take a 10-minute walk", done: false, count: 4 },
      { id: "read", name: "Read for 10 minutes", done: false, count: 3 },
    ],
    hobbies: ["Strength training", "Gaming", "Hiking"],
    weights: [
      { weightKg: "78.4", measuredAt: today },
      { weightKg: "78.1", measuredAt: "2026-10-03" },
    ],
    nutrition: [{ day: today, calories: 2100, proteinG: 130 }],
    scans: [],
    coachSettings: { provider: "builtin", model: "", hasPersonalKey: false },
    alias: "Nova",
    cheered: [] as string[],
  };
}
let state = seed();
export function resetDemo() {
  state = seed();
}
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export async function demoApi(
  path: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  const [route, search = ""] = path.split("?"),
    q = new URLSearchParams(search),
    v = (body ?? {}) as Record<string, any>;
  if (method === "GET") {
    switch (route) {
      case "auth":
      case "account":
        return clone({ user: state.user });
      case "game":
        return clone(state.game);
      case "economy":
        return {
          supply: 10000000,
          availableRewards: 9995000 - state.game.stats.coins,
        };
      case "workouts":
        return clone(state.workout);
      case "profile":
        return clone({ profile: state.workout.profile });
      case "cosmetics":
        return clone({ catalog, owned: state.owned });
      case "coach":
        return clone({ messages: state.coach });
      case "coach/settings":
        return clone(state.coachSettings);
      case "friends":
        return clone({
          joined: true,
          connections: state.friends,
          people: q.get("q")
            ? [{ userId: "new-friend", alias: "LinaLifts" }]
            : [],
        });
      case "messages":
        return clone({
          messages: state.messages.filter(
            (m) =>
              m.friendshipId === q.get("friendshipId") &&
              (!q.has("before") || m.id < Number(q.get("before"))),
          ),
        });
      case "guilds":
        return clone({
          userId: self,
          member: { alias: state.alias },
          list: state.guilds.filter((g) =>
            g.name.toLowerCase().includes((q.get("q") ?? "").toLowerCase()),
          ),
          mine: state.guilds.filter(
            (g) => g.ownerId === self || g.status !== null,
          ),
          selected: state.guilds.find((g) => g.id === q.get("id")) ?? null,
        });
      case "community":
        return clone({
          member: { alias: state.alias },
          leaderboard: [
            {
              userId: sara,
              alias: "SaraMoves",
              rank: 1,
              score: 420,
              cheered: state.cheered.includes(sara),
            },
            {
              userId: self,
              alias: state.alias,
              rank: 2,
              score: 380,
              cheered: true,
            },
            {
              userId: khalid,
              alias: "KhalidFit",
              rank: 3,
              score: 340,
              cheered: state.cheered.includes(khalid),
            },
          ],
        });
      case "habits":
        return clone({
          day: today,
          habits: state.habits,
          hobbies: state.hobbies,
        });
      case "weight":
        return clone({ weights: state.weights });
      case "nutrition":
        return clone({ logs: state.nutrition });
      case "inbody":
        return clone({ scans: state.scans });
    }
  }
  switch (route) {
    case "game":
      if (method === "PATCH") Object.assign(state.game.character, v);
      else {
        const quest = state.game.quests.find((x) => x.id === v.questId);
        if (!quest || quest.claimed || quest.current < quest.target)
          throw Error("Complete this demo quest first.");
        quest.claimed = true;
        state.game.stats.coins += quest.coins;
        state.game.stats.lifetimeXp += quest.xp;
      }
      break;
    case "cosmetics": {
      const item = catalog.find((i) => i.id === v.itemId);
      if (v.action === "buy") {
        if (!item) throw Error("Item unavailable");
        if (!state.owned.includes(item.id)) {
          if (state.game.stats.coins < item.price)
            throw Error("Not enough demo coins");
          state.game.stats.coins -= item.price;
          state.owned.push(item.id);
        }
      } else {
        const slot =
          item?.slot ??
          (
            {
              default: "skin",
              none: "aura",
              unarmed: "weapon",
              "no-trinket": "trinket",
              "no-vfx": "vfx",
            } as Record<string, string>
          )[v.itemId];
        if (item && !state.owned.includes(item.id))
          throw Error("Buy this demo item first");
        if (!slot) throw Error("Item unavailable");
        Object.assign(state.game.character, { [slot]: v.itemId });
      }
      break;
    }
    case "workouts":
      if (method === "POST") {
        state.workout.active = { id: "demo-session", templateId: v.templateId };
        state.workout.activeSets = [];
        return { session: state.workout.active };
      } else if (method === "PATCH") {
        const existing = state.workout.activeSets.find(
          (s) => s.exerciseId === v.exerciseId && s.setNumber === v.setNumber,
        );
        const set = {
          exerciseId: v.exerciseId,
          setNumber: v.setNumber,
          reps: v.reps,
          weightKg: String(v.weightKg),
        };
        if (existing) Object.assign(existing, set);
        else state.workout.activeSets.push(set);
      } else if (method === "PUT") {
        if (state.workout.activeSets.length < 3)
          throw Error("Log three sets first");
        const eligible = state.game.stats.todayWorkouts === 0;
        state.game.stats.todayWorkouts++;
        state.game.stats.weeklyWorkouts++;
        state.workout.active = null;
        const quest = state.game.quests.find((x) => x.id === "demo-training");
        if (quest) quest.current = 1;
        if (eligible) {
          state.game.stats.coins += 40;
          state.game.stats.lifetimeXp += 125;
        }
        return {
          xp: eligible ? 125 : 0,
          coins: eligible ? 40 : 0,
          rewardEligible: eligible,
        };
      }
      break;
    case "friends": {
      if (v.action === "request") {
        state.friends.push({
          id: "friend-new",
          userId: v.toUserId,
          alias: "LinaLifts",
          status: "pending",
          incoming: false,
          unread: 0,
        });
      } else {
        const f = state.friends.find((x) => x.id === v.friendshipId);
        if (f)
          f.status =
            (
              {
                accept: "accepted",
                block: "blocked",
                unblock: "removed",
              } as Record<string, string>
            )[v.action] ?? "removed";
      }
      break;
    }
    case "messages":
      if (method === "PATCH") {
        state.friends.forEach((f) => {
          if (f.id === v.friendshipId) f.unread = 0;
        });
      } else {
        const m = {
          id: state.messages.length + 1,
          friendshipId: String(v.friendshipId),
          senderId: self,
          body: String(v.body),
          createdAt: new Date().toISOString(),
        };
        state.messages.push(m);
        state.messages.push({
          id: m.id + 1,
          friendshipId: String(v.friendshipId),
          senderId:
            state.friends.find((f) => f.id === v.friendshipId)?.userId ?? sara,
          body: "Nice! Let’s keep going 💪 (demo reply)",
          createdAt: new Date().toISOString(),
        });
        return { message: m };
      }
      break;
    case "guilds": {
      if (v.action === "create") {
        const guild: Guild = {
          id: String(v.createId),
          name: v.name,
          description: v.description,
          hobbies: v.hobbies,
          ownerId: self,
          status: "accepted",
          count: 1,
          members: [
            {
              userId: self,
              alias: state.alias,
              status: "accepted",
              hobbies: state.hobbies,
            },
          ],
        };
        state.guilds.push(guild);
        return { guildId: guild.id };
      }
      const g = state.guilds.find((x) => x.id === v.id);
      if (!g) throw Error("Guild unavailable");
      if (["approve", "reject", "remove"].includes(v.action)) {
        const m = g.members?.find((x) => x.userId === v.userId);
        if (m) m.status = v.action === "approve" ? "accepted" : "removed";
        g.count =
          g.members?.filter((m) => m.status === "accepted").length ?? g.count;
      } else g.status = v.action === "apply" ? "pending" : null;
      break;
    }
    case "community":
      if (v.action === "join") state.alias = v.alias;
      else state.cheered.push(v.toUserId);
      break;
    case "coach": {
      const text = String(v.message),
        lower = text.toLowerCase();
      let proposal: CoachMessage["proposal"] = null;
      let content =
        "Thanks for sharing. In the real app your coach uses your profile and history. This demo can suggest exercises, nutrition targets, or a habit—try asking about one.";
      if (/exercise|workout|training|تمرين|تمارين/.test(lower)) {
        proposal = {
          type: "training",
          plan: {
            rationale:
              "A balanced demo plan with manageable volume. Review it before replacing future training days.",
            days: [
              {
                name: "Full body · Fresh start",
                exercises: [
                  {
                    name: "Goblet squat",
                    muscleGroup: "Legs",
                    sets: 3,
                    repMin: 10,
                    repMax: 12,
                  },
                  {
                    name: "Push-up",
                    muscleGroup: "Chest",
                    sets: 3,
                    repMin: 8,
                    repMax: 12,
                  },
                  {
                    name: "Cable row",
                    muscleGroup: "Back",
                    sets: 3,
                    repMin: 10,
                    repMax: 12,
                  },
                ],
              },
            ],
          },
        };
        content =
          "We can try a fresh full-body routine. Here’s a demo suggestion. Apply it only if you want to replace your upcoming plan.";
      } else if (/nutrition|protein|calorie|تغذي|اكل/.test(lower)) {
        proposal = {
          type: "targets",
          calories: 2500,
          proteinMin: 140,
          proteinMax: 165,
        };
        content =
          "Here’s a sample nutrition-target change. These are demo numbers, not a personalized recommendation.";
      } else if (/habit|عادة|عاده/.test(lower)) {
        proposal = { type: "habit", name: "Walk for 10 minutes after lunch" };
        content =
          "Start small and attach it to something you already do. Would this daily habit fit your routine?";
      }
      state.coach.push({
        id: "u-" + Date.now(),
        role: "user",
        content: text,
        proposal: null,
        status: "none",
      });
      const result: CoachMessage = {
        id: "a-" + Date.now(),
        role: "assistant",
        content,
        proposal,
        status: proposal ? "pending" : "none",
      };
      state.coach.push(result);
      return clone(result);
    }
    case "coach/actions": {
      const m = state.coach.find((x) => x.id === v.id);
      if (!m || m.status !== "pending")
        throw Error("Suggestion already handled");
      m.status = v.action === "apply" ? "applied" : "dismissed";
      if (v.action === "apply" && m.proposal) {
        const p = m.proposal;
        if (p.type === "training")
          state.workout.plan = p.plan.days.flatMap((d, i) =>
            d.exercises.map((e, j) => ({
              templateId: "coach-day-" + i,
              templateName: d.name,
              exerciseId: "coach-exercise-" + i + "-" + j,
              exerciseName: e.name,
              sets: e.sets,
              repMin: e.repMin,
              repMax: e.repMax,
            })),
          );
        if (p.type === "targets")
          Object.assign(state.workout.profile, {
            calorieTarget: p.calories,
            proteinMin: p.proteinMin,
            proteinMax: p.proteinMax,
          });
        if (p.type === "habit")
          state.habits.push({
            id: "habit-" + Date.now(),
            name: p.name,
            done: false,
            count: 0,
          });
      }
      break;
    }
    case "habits":
      if (v.action === "hobbies") state.hobbies = v.tags;
      else if (v.action === "create")
        state.habits.push({
          id: "habit-" + Date.now(),
          name: v.name,
          done: false,
          count: 0,
        });
      else {
        const h = state.habits.find((x) => x.id === v.id);
        if (h) {
          if (v.action === "archive")
            state.habits = state.habits.filter((x) => x.id !== v.id);
          else {
            h.done = v.action === "check";
            h.count += h.done ? 1 : -1;
          }
        }
      }
      break;
    case "account":
      Object.assign(state.user, {
        name: v.name,
        email: v.email,
        timezone: v.timezone,
      });
      return clone({ user: state.user });
    case "profile":
      Object.assign(state.workout.profile, v);
      return { applied: false };
    case "weight":
      state.weights.unshift({
        weightKg: String(v.weightKg),
        measuredAt: today,
      });
      state.workout.profile.currentWeightKg = String(v.weightKg);
      break;
    case "nutrition":
      state.nutrition = state.nutrition.filter((n) => n.day !== v.day);
      state.nutrition.unshift({
        day: v.day,
        calories: v.calories,
        proteinG: v.proteinG,
      });
      break;
    case "inbody":
      return { scan: v };
    case "coach/settings":
      throw Error(
        "Provider connections are disabled in this demo. No API key is sent or saved.",
      );
    default:
      throw Error("This device feature is not available in the browser demo.");
  }
  return { ok: true };
}
