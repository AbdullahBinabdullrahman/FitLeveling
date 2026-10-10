import { z } from "zod";
export const coachComponentsSchema = z
  .array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("image"),
        title: z.string().trim().min(1).max(120),
        src: z
          .string()
          .max(2000)
          .refine((value) => {
            if (/^\/coach-media\/[a-z0-9-]+\.png$/.test(value)) return true;
            try {
              const url = new URL(value);
              return (
                url.protocol === "https:" && !url.username && !url.password
              );
            } catch {
              return false;
            }
          }, "Use an HTTPS image or a coach library image"),
        alt: z.string().trim().min(1).max(300),
        caption: z.string().max(500).optional(),
      }),
      z.object({
        type: z.literal("exercise"),
        title: z.string().trim().min(1).max(120),
        steps: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
        cue: z.string().max(300).optional(),
      }),
      z.object({
        type: z.literal("timer"),
        title: z.string().trim().min(1).max(120),
        workSeconds: z.number().int().min(1).max(7200),
        restSeconds: z.number().int().min(0).max(3600).default(0),
        rounds: z.number().int().min(1).max(20).default(1),
      }),
      z.object({
        type: z.literal("checklist"),
        title: z.string().trim().min(1).max(120),
        items: z.array(z.string().trim().min(1).max(300)).min(1).max(12),
      }),
    ]),
  )
  .max(6);
export type CoachComponent = z.infer<typeof coachComponentsSchema>[number];
