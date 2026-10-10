import type { Targets, Tracking } from "./training-metrics";
export type Character = {
  name: string;
  archetype: string;
  color: string;
  accessory: string;
  animations: boolean;
  skin?: string;
  aura?: string;
  weapon?: string;
  trinket?: string;
  vfx?: string;
};
export type Quest = {
  id: string;
  title: string;
  description: string;
  kind: string;
  current: number;
  target: number;
  xp: number;
  coins: number;
  claimed: boolean;
  eventKey: string;
};
export type Game = {
  character: Character;
  stats: {
    level: number;
    coins: number;
    weeklyWorkouts: number;
    todayWorkouts: number;
    nutritionDays: number;
    lifetimeXp: number;
  };
  quests: Quest[];
  today: string;
  timezone: string;
  days: { day: string; trained: boolean; fueled: boolean }[];
};
export type Profile = {
  heightCm: string | null;
  currentWeightKg: string | null;
  birthYear: number | null;
  sexForEstimate: string | null;
  activityFactor: string | null;
  goal: string;
  calorieTarget: number;
  proteinMin: number;
  proteinMax: number;
  timezone: string;
};
export type Workout = {
  history?: {
    id: string;
    templateId: string;
    completedAt: string | null;
    startedAt: string;
  }[];
  past?: {
    exerciseId: string;
    weightKg: string | null;
    reps: number | null;
    metrics?: Targets;
    completedAt: string;
  }[];
  plan: {
    templateId: string;
    templateName: string;
    exerciseId: string;
    exerciseName: string;
    sets: number;
    repMin: number | null;
    repMax: number | null;
    tracking?: Tracking;
    targets?: Targets;
  }[];
  active: { id: string; templateId: string } | null;
  activeSets: {
    exerciseId: string;
    setNumber: number;
    weightKg: string | null;
    reps: number | null;
    metrics?: Targets;
  }[];
  profile: Profile;
};
export type Proposal =
  | {
      type: "training";
      plan: {
        rationale: string;
        days: {
          name: string;
          exercises: {
            name: string;
            muscleGroup: string;
            sets: number;
            repMin?: number | null;
            repMax?: number | null;
            tracking?: Tracking;
            durationSeconds?: number;
            distanceMeters?: number;
            speedKph?: number;
            inclinePercent?: number;
            restSeconds?: number;
            notes?: string;
          }[];
        }[];
      };
    }
  | {
      type: "targets";
      calories: number;
      proteinMin: number;
      proteinMax: number;
    }
  | { type: "nutrition"; day: string; calories: number; proteinG: number }
  | { type: "goal"; goal: string }
  | { type: "weight"; weightKg: number }
  | { type: "habit"; name: string }
  | { type: "hobbies"; tags: string[] };
export type CoachMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  components?: import("./coach-components").CoachComponent[];
  proposal: Proposal | null;
  status: string;
};
export type Guild = {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  hobbies: string[];
  status: string | null;
  count: number;
  members?: {
    userId: string;
    alias: string;
    status: string;
    hobbies: string[] | null;
  }[];
};
export type GuildData = {
  userId: string;
  list: Guild[];
  mine: Guild[];
  member: { alias: string } | null;
  selected: Guild | null;
};
export type Friend = {
  id: string;
  userId: string;
  alias: string;
  status: string;
  incoming: boolean;
  unread: number;
};
export type Friends = {
  joined: boolean;
  connections: Friend[];
  people: { userId: string; alias: string }[];
};
export type Item = {
  id: string;
  name: string;
  description: string;
  slot: string;
  price: number;
  rarity: string;
};
