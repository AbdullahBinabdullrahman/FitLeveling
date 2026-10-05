import { eq } from "drizzle-orm";
import type { db } from "@/db";
import { coinTreasury } from "@/db/schema";
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export function treasuryTransfer(
  balance: number,
  supply: number,
  amount: number,
) {
  if (
    !Number.isSafeInteger(amount) ||
    !Number.isSafeInteger(balance) ||
    !Number.isSafeInteger(supply) ||
    balance < 0 ||
    balance > supply
  )
    throw Error("Invalid coin transfer");
  const actual = amount > 0 ? Math.min(amount, balance) : amount;
  const next = balance - actual;
  if (next < 0 || next > supply) throw Error("Coin supply invariant failed");
  return { amount: actual, balance: next };
}
// Caller locks the player's profile first. All four wallet write paths use this order.
export async function circulateCoins(tx: Tx, amount: number) {
  const [bank] = await tx
    .select()
    .from(coinTreasury)
    .where(eq(coinTreasury.id, 1))
    .for("update");
  if (!bank) throw Error("Coin economy migration is required");
  const transfer = treasuryTransfer(bank.balance, bank.supply, amount);
  await tx
    .update(coinTreasury)
    .set({ balance: transfer.balance })
    .where(eq(coinTreasury.id, 1));
  return transfer.amount;
}
export function workoutRewardEligible(alreadyRewarded: boolean) {
  return !alreadyRewarded;
}
