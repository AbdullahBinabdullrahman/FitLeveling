import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "FitLeveling",
  slug: "fitleveling",
  version: "1.0.1",
  scheme: "fitleveling",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.FIT_IOS_BUNDLE_ID ?? "fit.fitleveling.app",
  },
  android: {
    package: process.env.FIT_ANDROID_PACKAGE ?? "fit.fitleveling.app",
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundColor: "#080E1A",
    },
  },
  web: { bundler: "metro", output: "single", favicon: "./assets/favicon.png" },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    ["expo-notifications", { color: "#4CE0CE" }],
  ],
  runtimeVersion: { policy: "appVersion" },
  ...(process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    ? {
        updates: {
          url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}`,
        },
        extra: { eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID } },
      }
    : {}),
  experiments: { typedRoutes: true },
});
