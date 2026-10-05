CREATE TABLE "coin_treasury" (
	"id" integer PRIMARY KEY NOT NULL,
	"supply" integer NOT NULL,
	"balance" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "coin_treasury" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
LOCK TABLE profiles IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
ALTER TABLE coin_treasury ADD CONSTRAINT fixed_supply CHECK (id = 1 AND supply = 10000000 AND balance >= 0 AND balance <= supply);
--> statement-breakpoint
INSERT INTO coin_treasury (id, supply, balance)
SELECT 1, 10000000, 10000000 - COALESCE(SUM(coins), 0) FROM profiles;
