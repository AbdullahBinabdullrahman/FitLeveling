import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
export const storage = {
  async getItem(key: string) {
    if (Platform.OS === "web")
      return typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(key)
        : null;
    const n = Number((await SecureStore.getItemAsync(key + ".count")) ?? 0);
    if (!n) return null;
    const parts = await Promise.all(
      Array.from({ length: n }, (_, i) =>
        SecureStore.getItemAsync(key + "." + i),
      ),
    );
    return parts.some((v) => v === null) ? null : parts.join("");
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      sessionStorage.setItem(key, value);
      return;
    }
    await this.removeItem(key);
    const parts = value.match(/[\s\S]{1,1000}/g) ?? [""];
    await Promise.all(
      parts.map((v, i) => SecureStore.setItemAsync(key + "." + i, v)),
    );
    await SecureStore.setItemAsync(key + ".count", String(parts.length));
  },
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(key);
      return;
    }
    const n = Number((await SecureStore.getItemAsync(key + ".count")) ?? 0);
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        SecureStore.deleteItemAsync(key + "." + i),
      ),
    );
    await SecureStore.deleteItemAsync(key + ".count");
  },
};
