ALTER TABLE "characters" ADD COLUMN "weapon" text DEFAULT 'unarmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "trinket" text DEFAULT 'no-trinket' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "vfx" text DEFAULT 'no-vfx' NOT NULL;