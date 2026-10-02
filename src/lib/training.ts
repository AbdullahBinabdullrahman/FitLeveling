import { z } from 'zod';
export const checkinSchema = z.object({
  day: z.iso.date(), goal: z.enum(['lose', 'maintain', 'gain']),
  energy: z.number().int().min(1).max(5), sleepHours: z.number().min(0).max(24),
  notes: z.string().trim().max(2000), preferences: z.string().trim().max(1000),
});
export const planSchema = z.object({
  rationale: z.string().trim().min(1).max(2000),
  days: z.array(z.object({
    name: z.string().trim().min(1).max(100),
    exercises: z.array(z.object({
      name: z.string().trim().min(1).max(120), muscleGroup: z.string().trim().max(80),
      sets: z.number().int().min(1).max(6), repMin: z.number().int().min(1).max(30),
      repMax: z.number().int().min(1).max(30),
    }).refine(e => e.repMax >= e.repMin, 'Maximum reps must be at least minimum reps'))
      .min(1).max(10).refine(es => new Set(es.map(e => e.name.toLowerCase())).size === es.length, 'Use each exercise once per day'),
  })).min(1).max(7),
});
export type TrainingPlan = z.infer<typeof planSchema>;
