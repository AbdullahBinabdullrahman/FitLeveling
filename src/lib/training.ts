import { z } from "zod";
export const checkinSchema = z.object({
  day: z.iso.date(),
  goal: z.enum(["lose", "maintain", "gain"]),
  energy: z.number().int().min(1).max(5),
  sleepHours: z.number().min(0).max(24),
  notes: z.string().trim().max(2000),
  preferences: z.string().trim().max(1000),
});
export const exerciseSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    muscleGroup: z.string().trim().max(80),
    tracking: z
      .enum(["reps", "duration", "distance", "intervals"])
      .default("reps"),
    sets: z.number().int().min(1).max(20),
    repMin: z.number().int().min(1).max(100).nullable().optional(),
    repMax: z.number().int().min(1).max(100).nullable().optional(),
    durationSeconds: z.number().int().min(1).max(86400).optional(),
    distanceMeters: z.number().min(1).max(500000).optional(),
    speedKph: z.number().min(0.1).max(100).optional(),
    inclinePercent: z.number().min(-20).max(40).optional(),
    restSeconds: z.number().int().min(0).max(3600).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((e, ctx) => {
    const error = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (e.tracking === "reps") {
      if (!e.repMin || !e.repMax)
        error("repMin", "Repetition exercises need a rep range");
      if (e.repMin && e.repMax && e.repMax < e.repMin)
        error("repMax", "Maximum reps must be at least minimum reps");
    } else {
      if (e.repMin != null || e.repMax != null)
        error("repMin", "Timed and distance exercises do not use reps");
      if (e.tracking === "distance" && !e.distanceMeters)
        error("distanceMeters", "Distance is required");
      if (
        (e.tracking === "duration" || e.tracking === "intervals") &&
        !e.durationSeconds
      )
        error("durationSeconds", "Duration is required");
      if (e.tracking === "intervals" && e.restSeconds == null)
        error("restSeconds", "Intervals need a rest duration");
    }
  });
export const planSchema = z.object({
  rationale: z.string().trim().min(1).max(2000),
  days: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        exercises: z
          .array(exerciseSchema)
          .min(1)
          .max(20)
          .refine(
            (es) =>
              new Set(es.map((e) => e.name.toLowerCase())).size === es.length,
            "Use each exercise once per day",
          ),
      }),
    )
    .min(1)
    .max(7),
});
export type TrainingPlan = z.infer<typeof planSchema>;
