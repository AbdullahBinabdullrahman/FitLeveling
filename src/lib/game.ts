export const ARCHETYPES = [
  {
    id: "vanguard",
    name: "Vanguard",
    description: "Steady strength. One rep at a time.",
    symbol: "◆",
  },
  {
    id: "ranger",
    name: "Ranger",
    description: "Curiosity, movement, and momentum.",
    symbol: "↗",
  },
  {
    id: "mystic",
    name: "Mystic",
    description: "Find your focus. Build your balance.",
    symbol: "✦",
  },
] as const;
export const COLORS = [
  { id: "mint", name: "Ion mint", hex: "#4ce0ce" },
  { id: "violet", name: "Nebula violet", hex: "#b89aff" },
  { id: "amber", name: "Solar amber", hex: "#ffcb75" },
  { id: "rose", name: "Cosmic rose", hex: "#ff91b2" },
] as const;
export const ACCESSORIES = [
  { id: "none", name: "Explorer", level: 1 },
  { id: "cape", name: "Hunter cape", level: 3 },
  { id: "halo", name: "Orbit halo", level: 5 },
  { id: "crown", name: "Star crown", level: 10 },
] as const;
export type Character = {
  name: string;
  archetype: (typeof ARCHETYPES)[number]["id"];
  color: (typeof COLORS)[number]["id"];
  accessory: (typeof ACCESSORIES)[number]["id"];
  animations: boolean;
  skin?: string;
  aura?: string;
};
export const DEFAULT_CHARACTER: Character = {
  name: "Nova",
  archetype: "vanguard",
  color: "mint",
  accessory: "none",
  animations: true,
};
export type Quest = {
  id: string;
  title: string;
  description: string;
  kind: "daily" | "weekly" | "achievement";
  current: number;
  target: number;
  xp: number;
  coins: number;
  claimed: boolean;
  eventKey: string;
};
export type GameStats = {
  workouts: number;
  weeklyWorkouts: number;
  trainingDays: number;
  nutritionDays: number;
  weighIns: number;
  todayWorkouts: number;
  todayNutrition: number;
  level: number;
  lifetimeXp: number;
  coins: number;
};
export type GameData = {
  character: Character;
  stats: GameStats;
  quests: Quest[];
  week: string;
  today: string;
  timezone: string;
  days: { day: string; trained: boolean; fueled: boolean }[];
};
export type CelebrationData = {
  title: string;
  xp: number;
  coins: number;
  prs?: number;
  levelUp?: boolean;
};

export function dayKey(date: Date, timezone = "Asia/Riyadh") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function weekKey(day: string) {
  const date = new Date(day + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
export function weekDays(week: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(week + "T12:00:00Z");
    date.setUTCDate(date.getUTCDate() + i);
    return date.toISOString().slice(0, 10);
  });
}
export function buildQuests(
  stats: GameStats,
  userId: string,
  today: string,
  claimedKeys: Set<string>,
): Quest[] {
  const week = weekKey(today);
  const items: Omit<Quest, "eventKey" | "claimed">[] = [
    {
      id: "daily-fuel",
      title: "Fuel check",
      description: "Log today’s nutrition. Awareness is progress.",
      kind: "daily",
      current: stats.todayNutrition,
      target: 1,
      xp: 15,
      coins: 5,
    },
    {
      id: "weekly-train",
      title: "Double dispatch",
      description: "Complete two workouts this week.",
      kind: "weekly",
      current: stats.weeklyWorkouts,
      target: 2,
      xp: 80,
      coins: 25,
    },
    {
      id: "weekly-fuel",
      title: "Fuel the journey",
      description: "Log nutrition on three days this week.",
      kind: "weekly",
      current: stats.nutritionDays,
      target: 3,
      xp: 50,
      coins: 20,
    },
    {
      id: "weekly-weight",
      title: "Know your baseline",
      description: "Check in with your weight once this week.",
      kind: "weekly",
      current: stats.weighIns,
      target: 1,
      xp: 25,
      coins: 10,
    },
    {
      id: "weekly-boss",
      title: "The Iron Colossus",
      description:
        "Train on three different days this week. Each day removes a shield.",
      kind: "weekly",
      current: stats.trainingDays,
      target: 3,
      xp: 180,
      coins: 75,
    },
    ...[1, 5, 10, 25, 50].map((target, index) => ({
      id: `workouts-${target}`,
      title: [
        "First contact",
        "Finding your rhythm",
        "Double digits",
        "A new habit",
        "Built to last",
      ][index],
      description: `Complete ${target} workout${target === 1 ? "" : "s"} across your journey.`,
      kind: "achievement" as const,
      current: stats.workouts,
      target,
      xp: 40 + index * 30,
      coins: 10 + index * 10,
    })),
  ];
  return items.map((q) => {
    const period =
      q.kind === "daily" ? today : q.kind === "weekly" ? week : "lifetime";
    const eventKey = `quest:${userId}:${q.id}:${period}`;
    return {
      ...q,
      current: Math.min(q.target, q.current),
      eventKey,
      claimed: claimedKeys.has(eventKey),
    };
  });
}
