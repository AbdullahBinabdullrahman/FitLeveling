import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { storage } from "./storage";
import { api } from "./api";
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
async function installationId() {
  let id = await storage.getItem("fit-installation");
  if (!id) {
    id = Crypto.randomUUID();
    await storage.setItem("fit-installation", id);
  }
  return id;
}
async function permission() {
  if (Platform.OS === "web")
    throw Error(
      "Notification settings are available in the iOS and Android app.",
    );
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("default", {
      name: "FitLeveling",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const existing = await Notifications.getPermissionsAsync();
  const result = existing.granted
    ? existing
    : await Notifications.requestPermissionsAsync();
  if (!result.granted)
    throw Error(
      "Notifications are disabled. Enable them in your phone settings to continue.",
    );
}
export async function registerPush() {
  await permission();
  if (!Device.isDevice)
    throw Error(
      "Push notifications need a physical device. Local reminders also work in a simulator.",
    );
  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId)
    throw Error(
      "Push notifications need an EAS project ID and configured Apple/Google push credentials.",
    );
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  await api("notifications", "POST", {
    installationId: await installationId(),
    token,
    social: true,
  });
}
export async function unregisterPush() {
  if (Platform.OS === "web") return;
  const id = await storage.getItem("fit-installation");
  if (id) await api(`notifications?installationId=${id}`, "DELETE");
}
export async function cancelReminders() {
  if (Platform.OS === "web") return;
  for (const n of await Notifications.getAllScheduledNotificationsAsync())
    if (n.content.data?.kind === "fit-reminder")
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
}
export async function setReminder(enabled: boolean, hour = 18, minute = 0) {
  if (enabled) await permission();
  await cancelReminders();
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "A small step for today",
      body: "Your workout, a habit, or a rest-day check-in — choose what fits.",
      data: { kind: "fit-reminder", screen: "home" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "default",
    },
  });
}
