import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationDevices } from "@/db/schema";
export async function notifySocial(
  userId: string,
  kind: "friends" | "chat" | "guilds",
) {
  try {
    const devices = await db
      .select()
      .from(notificationDevices)
      .where(
        and(
          eq(notificationDevices.userId, userId),
          eq(notificationDevices.social, true),
        ),
      );
    if (!devices.length) return;
    const titles = {
      friends: "New friend request",
      chat: "New message",
      guilds: "Guild update",
    };
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(
        devices
          .slice(0, 100)
          .map((d) => ({
            to: d.token,
            title: titles[kind],
            body: "Open FitLeveling to see what’s new.",
            sound: "default",
            data: { screen: "community", section: kind },
          })),
      ),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return;
    const payload = await response.json();
    for (const [i, ticket] of (Array.isArray(payload.data)
      ? payload.data
      : []
    ).entries())
      if (ticket.details?.error === "DeviceNotRegistered")
        await db
          .delete(notificationDevices)
          .where(
            and(
              eq(notificationDevices.installationId, devices[i].installationId),
              eq(notificationDevices.token, devices[i].token),
            ),
          );
  } catch {
    /* Push delivery never rolls back saved app data. */
  }
}
