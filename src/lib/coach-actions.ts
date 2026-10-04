import { z } from "zod";
import { planSchema } from "./training";
import { tagsSchema } from "./interests";
export const coachProposalSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("training"), plan: planSchema }),
  z
    .object({
      type: z.literal("targets"),
      calories: z.number().int().min(1200).max(6000),
      proteinMin: z.number().int().min(20).max(350),
      proteinMax: z.number().int().min(20).max(350),
    })
    .refine(
      (v) => v.proteinMax >= v.proteinMin,
      "Maximum protein must be at least minimum protein",
    ),
  z.object({
    type: z.literal("nutrition"),
    day: z.iso.date(),
    calories: z.number().int().min(0).max(10000),
    proteinG: z.number().int().min(0).max(500),
  }),
  z.object({
    type: z.literal("goal"),
    goal: z.enum(["lose", "maintain", "gain"]),
  }),
  z.object({
    type: z.literal("habit"),
    name: z.string().trim().min(1).max(80),
  }),
  z.object({ type: z.literal("hobbies"), tags: tagsSchema }),
  z.object({
    type: z.literal("weight"),
    weightKg: z.number().min(25).max(400),
  }),
]);
export type CoachProposal = z.infer<typeof coachProposalSchema>;
export function parseCoachResponse(raw: string) {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  if (!text.startsWith("{")) return { reply: raw, proposal: null };
  try {
    return z
      .object({
        reply: z.string().trim().min(1).max(6000),
        proposal: coachProposalSchema.nullable().default(null),
      })
      .parse(JSON.parse(text));
  } catch {
    throw Error(
      "The coach’s proposal was incomplete. Nothing was saved. Ask again with a smaller change.",
    );
  }
}
export function assertFresh(status: string, createdAt: Date, now = new Date()) {
  if (status !== "pending")
    throw Error("This suggestion has already been handled");
  if (now.getTime() - createdAt.getTime() > 86400000)
    throw Error("This suggestion expired. Ask your coach for a fresh one.");
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function assertUnchanged(before: unknown, current: unknown) {
  if (JSON.stringify(canonical(before)) !== JSON.stringify(canonical(current)))
    throw Error(
      "Your saved data changed since this suggestion. Ask your coach to review the latest values.",
    );
}
