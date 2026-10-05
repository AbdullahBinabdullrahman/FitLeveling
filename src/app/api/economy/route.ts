import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coinTreasury } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { fail } from "@/lib/http";
export async function GET() {
  try {
    await requireUser();
    const [bank] = await db
      .select()
      .from(coinTreasury)
      .where(eq(coinTreasury.id, 1));
    if (!bank) throw Error("Coin economy migration is required");
    return NextResponse.json({
      supply: bank.supply,
      availableRewards: bank.balance,
      circulating: bank.supply - bank.balance,
    });
  } catch (e) {
    return fail(e);
  }
}
