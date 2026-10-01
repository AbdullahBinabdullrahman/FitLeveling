CREATE TABLE "coin_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"event_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coin_transactions_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"muscle_group" text,
	"increment_kg" numeric DEFAULT '2.5',
	CONSTRAINT "exercises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "inbody_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"measured_at" date NOT NULL,
	"weight_kg" numeric NOT NULL,
	"body_fat_percent" numeric,
	"skeletal_muscle_kg" numeric,
	"fat_mass_kg" numeric,
	"measured_bmr" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day" date NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"height_cm" numeric,
	"current_weight_kg" numeric,
	"starting_weight_kg" numeric,
	"birth_year" integer,
	"sex_for_estimate" text,
	"activity_factor" numeric DEFAULT '1.375',
	"goal" text DEFAULT 'lose',
	"calorie_target" integer DEFAULT 2200,
	"protein_min" integer DEFAULT 160,
	"protein_max" integer DEFAULT 170,
	"target_mode" text DEFAULT 'manual',
	"level" integer DEFAULT 1 NOT NULL,
	"lifetime_xp" integer DEFAULT 0 NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"timezone" text DEFAULT 'Asia/Riyadh' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"cost_snapshot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"cost" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workout_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric NOT NULL,
	"reps" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "target_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calories" integer NOT NULL,
	"protein_min" integer NOT NULL,
	"protein_max" integer NOT NULL,
	"method" text NOT NULL,
	"inputs" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"rep_min" integer NOT NULL,
	"rep_max" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "body_weights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"weight_kg" numeric NOT NULL,
	"measured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"event_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "xp_transactions_event_key_unique" UNIQUE("event_key")
);
--> statement-breakpoint
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbody_scans" ADD CONSTRAINT "inbody_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_logs" ADD CONSTRAINT "nutrition_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sessions" ADD CONSTRAINT "workout_sessions_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_session_id_workout_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."workout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_sets" ADD CONSTRAINT "workout_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_versions" ADD CONSTRAINT "target_versions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_workout_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."workout_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_templates" ADD CONSTRAINT "workout_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_weights" ADD CONSTRAINT "body_weights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "nutrition_user_day" ON "nutrition_logs" USING btree ("user_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "session_exercise_set" ON "workout_sets" USING btree ("session_id","exercise_id","set_number");