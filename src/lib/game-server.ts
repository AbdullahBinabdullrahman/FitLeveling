import { and, eq, like } from "drizzle-orm";
import { db } from "@/db";
import {
  characters,
  nutrition,
  profiles,
  sessions,
  weights,
  xpTransactions,
} from "@/db/schema";
import {
  buildQuests,
  dayKey,
  DEFAULT_CHARACTER,
  weekDays,
  weekKey,
  type Character,
  type GameData,
} from "./game";

type Reader = Pick<typeof db, "select">;
export async function readGame(
  userId: string,
  reader: Reader = db,
  now = new Date(),
): Promise<GameData> {
  const [profileRows, characterRows, completed, food, weightLogs, claims] =
    await Promise.all([
      reader.select().from(profiles).where(eq(profiles.userId, userId)),
      reader.select().from(characters).where(eq(characters.userId, userId)),
      reader
        .select({ completedAt: sessions.completedAt })
        .from(sessions)
        .where(
          and(eq(sessions.userId, userId), eq(sessions.status, "completed")),
        ),
      reader
        .select({ day: nutrition.day })
        .from(nutrition)
        .where(eq(nutrition.userId, userId)),
      reader
        .select({ measuredAt: weights.measuredAt })
        .from(weights)
        .where(eq(weights.userId, userId)),
      reader
        .select({ eventKey: xpTransactions.eventKey })
        .from(xpTransactions)
        .where(
          and(
            eq(xpTransactions.userId, userId),
            like(xpTransactions.eventKey, `quest:${userId}:%`),
          ),
        ),
    ]);
  const profile = profileRows[0];
  if (!profile) throw new Error("NOT_FOUND");
  const today = dayKey(now, profile.timezone);
  const week = weekKey(today);
  const workoutDays = completed
    .filter((s) => s.completedAt && s.completedAt <= now)
    .map((s) => dayKey(s.completedAt!, profile.timezone));
  const thisWeek = (day: string) => day >= week && day <= today;
  const trained = new Set(workoutDays.filter(thisWeek));
  const fueled = new Set(food.filter((f) => thisWeek(f.day)).map((f) => f.day));
  const stats = {
    workouts: workoutDays.length,
    weeklyWorkouts: workoutDays.filter(thisWeek).length,
    trainingDays: trained.size,
    nutritionDays: fueled.size,
    weighIns: weightLogs.filter(
      (w) =>
        w.measuredAt <= now && thisWeek(dayKey(w.measuredAt, profile.timezone)),
    ).length,
    todayWorkouts: workoutDays.filter((d) => d === today).length,
    todayNutrition: fueled.has(today) ? 1 : 0,
    level: profile.level,
    lifetimeXp: profile.lifetimeXp,
    coins: profile.coins,
  };
  const character = characterRows[0]
    ? ({
        name: characterRows[0].name,
        archetype: characterRows[0].archetype,
        color: characterRows[0].color,
        accessory: characterRows[0].accessory,
        animations: characterRows[0].animations,
        skin: characterRows[0].skin,
        aura: characterRows[0].aura,
        weapon: characterRows[0].weapon,
        trinket: characterRows[0].trinket,
        vfx: characterRows[0].vfx,
      } as Character)
    : DEFAULT_CHARACTER;
  return {
    character,
    stats,
    today,
    week,
    timezone: profile.timezone,
    quests: buildQuests(
      stats,
      userId,
      today,
      new Set(claims.map((c) => c.eventKey)),
    ),
    days: weekDays(week).map((day) => ({
      day,
      trained: trained.has(day),
      fueled: fueled.has(day),
    })),
  };
}
