ALTER TABLE "workout_sets" ALTER COLUMN "weight_kg" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_sets" ALTER COLUMN "reps" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "template_exercises" ALTER COLUMN "rep_min" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "template_exercises" ALTER COLUMN "rep_max" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "coach_messages" ADD COLUMN IF NOT EXISTS "components" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD COLUMN IF NOT EXISTS "metrics" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD COLUMN IF NOT EXISTS "tracking" text DEFAULT 'reps' NOT NULL;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD COLUMN IF NOT EXISTS "targets" jsonb DEFAULT '{}'::jsonb NOT NULL;