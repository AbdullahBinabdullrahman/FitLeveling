import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { GameData } from "./game";

function encryptionKey(secret = process.env.SESSION_SECRET) {
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must be at least 32 characters");
  return createHash("sha256")
    .update("levelup-coach-key:" + secret)
    .digest();
}
export function encryptApiKey(value: string, secret?: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((b) => b.toString("base64"))
    .join(".");
}
export function decryptApiKey(value: string, secret?: string) {
  const parts = value.split(".");
  if (parts.length !== 3)
    throw new Error("Reconnect your AI API key in coach settings");
  const [iv, tag, encrypted] = parts.map((p) => Buffer.from(p, "base64"));
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Reconnect your AI API key in coach settings");
  }
}
export function extractResponseText(response: {
  output?: {
    type: string;
    content?: { type: string; text?: string; refusal?: string }[];
  }[];
}) {
  return (
    response.output
      ?.flatMap((item) => (item.type === "message" ? (item.content ?? []) : []))
      .map((content) =>
        content.type === "output_text"
          ? (content.text ?? "")
          : content.type === "refusal"
            ? (content.refusal ?? "")
            : "",
      )
      .filter(Boolean)
      .join("\n") ?? ""
  );
}
export function builtinReply(message: string, game: GameData) {
  const { stats, character } = game;
  if (
    /\b(pain|injur\w*|dizz\w*|faint\w*|breathless)\b|shortness of breath/i.test(
      message,
    )
  )
    return "Pause training if you feel pain, dizziness, or unusual symptoms. Seek qualified medical help for symptoms that concern you. Your character can wait; your health comes first.";
  if (/\b(rest|tired|recover\w*|sore|sleep)\b/i.test(message))
    return `${character.name} is in recovery mode. A rest day is part of your training: prioritize sleep, eat regular meals, and try gentle movement only if it feels comfortable. You don’t lose XP or coins by resting.`;
  if (/fuel|food|nutrition|protein|calorie/i.test(message))
    return `You’ve logged nutrition on ${stats.nutritionDays} day${stats.nutritionDays === 1 ? "" : "s"} this week. Try a simple check-in after your usual meal today. The Fuel the journey quest rewards three days of logging, regardless of the numbers. Review your personal nutrition targets in Profile.`;
  if (/quest|boss|mission/i.test(message)) {
    const quest = game.quests.find((q) => !q.claimed && q.current >= q.target);
    return quest
      ? `Your “${quest.title}” reward is ready! Claim it in Quests for ${quest.xp} XP and ${quest.coins} coins, plus any level-up bonus. Next, choose a manageable mission and leave room for recovery.`
      : `The Iron Colossus has ${Math.max(0, 3 - stats.trainingDays)} shield${3 - stats.trainingDays === 1 ? "" : "s"} remaining. Train on three different days this week to clear it. A nutrition check-in or a weekly weight log is another small step you can take today.`;
  }
  if (/workout|train|next|start/i.test(message))
    return `You’ve completed ${stats.weeklyWorkouts} workout${stats.weeklyWorkouts === 1 ? "" : "s"} this week. Open Train to continue your Push / Pull / Legs rotation. Start with a comfortable weight and use your previous logs as a reference. ${stats.todayWorkouts ? "You’ve already trained today; recovery is a good next mission." : "Focus on one set at a time; your progress is saved as you log."}`;
  return `${character.name} is level ${stats.level}, powered by ${stats.workouts} completed workout${stats.workouts === 1 ? "" : "s"}. Pick one small next step: a planned workout, a fuel check-in, or a rest day. Ask me about your quests, training, nutrition logging, or recovery for a specific suggestion. Every sustainable step counts.`;
}
