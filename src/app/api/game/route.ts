import { circulateCoins } from "@/lib/economy";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  characters,
  cosmeticInventory,
  coinTransactions,
  profiles,
  xpTransactions,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { readGame } from "@/lib/game-server";
import { ACCESSORIES } from "@/lib/game";
import { cosmeticById } from "@/lib/community";
import { levelFromXp } from "@/lib/domain";

export async function GET() {
  try {
    return NextResponse.json(await readGame(await requireUser()));
  } catch (error) {
    return fail(error);
  }
}
const characterInput = z.object({
  name: z.string().trim().min(2).max(24),
  archetype: z.enum(["vanguard", "ranger", "mystic"]),
  color: z.enum(["mint", "violet", "amber", "rose"]),
  accessory: z.enum(["none", "cape", "halo", "crown"]),
  animations: z.boolean(),
  skin: z.string().max(50).optional(),
  aura: z.string().max(50).optional(),
  weapon: z.string().max(50).optional(),
  trinket: z.string().max(50).optional(),
  vfx: z.string().max(50).optional(),
});
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUser();
    const input = characterInput.parse(await request.json());
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId));
    if (!profile) throw new Error("NOT_FOUND");
    for (const [slot, itemId] of [
      ["skin", input.skin],
      ["aura", input.aura],
      ["weapon", input.weapon],
      ["trinket", input.trinket],
      ["vfx", input.vfx],
    ] as const) {
      if (
        !itemId ||
        itemId ===
          {
            skin: "default",
            aura: "none",
            weapon: "unarmed",
            trinket: "no-trinket",
            vfx: "no-vfx",
          }[slot]
      )
        continue;
      const item = cosmeticById(itemId);
      const [owned] = await db
        .select()
        .from(cosmeticInventory)
        .where(
          and(
            eq(cosmeticInventory.userId, userId),
            eq(cosmeticInventory.itemId, itemId),
          ),
        );
      if (!item || item.slot !== slot || !owned)
        throw new Error("Unlock this item in the shop first");
    }
    const accessory = ACCESSORIES.find((a) => a.id === input.accessory)!;
    if (profile.level < accessory.level)
      throw new Error(
        `Reach level ${accessory.level} to equip ${accessory.name}`,
      );
    await db
      .insert(characters)
      .values({ userId, ...input })
      .onConflictDoUpdate({ target: characters.userId, set: input });
    return NextResponse.json({ character: input });
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    const { questId } = z
      .object({ questId: z.string().max(80) })
      .parse(await request.json());
    const result = await db.transaction(async (tx) => {
      // All progression writes lock this row, including workout completion.
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .for("update");
      if (!profile) throw new Error("NOT_FOUND");
      const game = await readGame(userId, tx);
      const quest = game.quests.find((q) => q.id === questId);
      if (!quest) throw new Error("NOT_FOUND");
      if (quest.claimed) return { alreadyClaimed: true, xp: 0, coins: 0 };
      if (quest.current < quest.target)
        throw new Error("Complete the quest before claiming your reward");
      const lifetimeXp = profile.lifetimeXp + quest.xp;
      const level = levelFromXp(lifetimeXp).level;
      const coins = await circulateCoins(
        tx,
        quest.coins + (level - profile.level) * 50,
      );
      await tx.insert(xpTransactions).values({
        userId,
        amount: quest.xp,
        reason: quest.title,
        eventKey: quest.eventKey,
      });
      await tx.insert(coinTransactions).values({
        userId,
        amount: coins,
        reason: quest.title,
        eventKey: quest.eventKey,
      });
      await tx
        .update(profiles)
        .set({ lifetimeXp, level, coins: profile.coins + coins })
        .where(eq(profiles.userId, userId));
      return {
        title: quest.title,
        xp: quest.xp,
        coins,
        levelUp: level > profile.level,
      };
    });
    return NextResponse.json(result);
  } catch (error) {
    return fail(error);
  }
}
