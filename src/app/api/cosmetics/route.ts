import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  profiles,
  characters,
  cosmeticInventory,
  coinTransactions,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
import { COSMETICS, cosmeticById } from "@/lib/community";
export async function GET() {
  try {
    const id = await requireUser();
    const owned = await db
      .select()
      .from(cosmeticInventory)
      .where(eq(cosmeticInventory.userId, id));
    return NextResponse.json({
      catalog: COSMETICS,
      owned: owned.map((i) => i.itemId),
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
    const { action, itemId } = z
      .object({ action: z.enum(["buy", "equip"]), itemId: z.string().max(50) })
      .parse(await request.json());
    const item = cosmeticById(itemId);
    if (!item && itemId !== "default" && itemId !== "none")
      throw new Error("NOT_FOUND");
    const result = await db.transaction(async (tx) => {
      const [profile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .for("update");
      if (!profile) throw new Error("NOT_FOUND");
      const [owned] = await tx
        .select()
        .from(cosmeticInventory)
        .where(
          and(
            eq(cosmeticInventory.userId, userId),
            eq(cosmeticInventory.itemId, itemId),
          ),
        );
      if (action === "buy") {
        if (!item) throw new Error("This item is free to equip");
        if (owned) return { alreadyOwned: true, coins: profile.coins };
        if (profile.coins < item.price)
          throw new Error("Earn more coins to unlock this item");
        await tx
          .insert(cosmeticInventory)
          .values({ userId, itemId, pricePaid: item.price });
        await tx
          .insert(coinTransactions)
          .values({
            userId,
            amount: -item.price,
            reason: `Cosmetic: ${item.name}`,
            eventKey: `cosmetic:${userId}:${itemId}`,
          });
        await tx
          .update(profiles)
          .set({ coins: profile.coins - item.price })
          .where(eq(profiles.userId, userId));
        return { coins: profile.coins - item.price };
      }
      if (item && !owned)
        throw new Error("Unlock this item before equipping it");
      const slot = item?.slot ?? (itemId === "default" ? "skin" : "aura");
      await tx
        .insert(characters)
        .values({ userId, [slot]: itemId })
        .onConflictDoUpdate({
          target: characters.userId,
          set: { [slot]: itemId },
        });
      return { equipped: itemId };
    });
    return NextResponse.json(result);
  } catch (e) {
    return fail(e);
  }
}
