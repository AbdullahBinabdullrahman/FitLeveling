import { coachComponentsSchema } from "./coach-components";
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
export class CoachResponseError extends Error {
  constructor(public readonly issues: { path: string; code: string }[]) {
    super("The coach could not format its response. Please try again.");
  }
}
export function parseCoachResponse(raw: string) {
  const text = raw
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "");
  if (!text) throw new CoachResponseError([{ path: "reply", code: "empty" }]);
  if (!text.startsWith("{") && !text.startsWith("["))
    return { reply: text, proposal: null, issues: [] };
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new CoachResponseError([{ path: "response", code: "invalid_json" }]);
  }
  const envelope = z
    .object({
      reply: z.string().trim().min(1).max(6000),
      proposal: z.unknown().optional(),
      components: coachComponentsSchema.optional(),
    })
    .safeParse(value);
  const summarize = (issues: z.core.$ZodIssue[]) =>
    issues.map((i) => ({
      path: i.path.join("."),
      code: i.code,
    }));
  if (!envelope.success)
    throw new CoachResponseError(summarize(envelope.error.issues));
  if (envelope.data.proposal == null)
    return {
      reply: envelope.data.reply,
      ...(envelope.data.components?.length
        ? { components: envelope.data.components }
        : {}),
      proposal: null,
      issues: [],
    };
  const proposal = coachProposalSchema.safeParse(envelope.data.proposal);
  if (!proposal.success)
    return {
      reply: envelope.data.reply,
      proposal: null,
      issues: summarize(proposal.error.issues),
    };
  return {
    reply: envelope.data.reply,
    ...(envelope.data.components?.length
      ? { components: envelope.data.components }
      : {}),
    proposal: proposal.data,
    issues: [],
  };
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
