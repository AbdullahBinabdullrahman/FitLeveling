CREATE TABLE "characters" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Nova' NOT NULL,
	"archetype" text DEFAULT 'vanguard' NOT NULL,
	"color" text DEFAULT 'mint' NOT NULL,
	"accessory" text DEFAULT 'none' NOT NULL,
	"animations" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'builtin' NOT NULL,
	"model" text DEFAULT '' NOT NULL,
	"encrypted_api_key" text,
	"last_request_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_settings" ADD CONSTRAINT "coach_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;