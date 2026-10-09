import { DEMO } from "../lib/demo";
import { useEffect } from "react";
import { Stack, router } from "expo-router";
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AppState,
  Platform,
  View,
  ActivityIndicator,
  Text,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AuthProvider, useAuth } from "../lib/auth";
import { colors } from "../components/ui";
const queryClient = new QueryClient();
function DemoBanner() {
  const { logout } = useAuth();
  return (
    <View style={{ padding: 10, backgroundColor: "#183A40", gap: 5 }}>
      <Text style={{ color: colors.mint, textAlign: "center", fontSize: 12 }}>
        DEMO · بيانات تجريبية · لا يتم إرسال أي بيانات للخادم
      </Text>
      <Pressable accessibilityRole="button" onPress={() => logout()}>
        <Text style={{ color: colors.text, textAlign: "center", fontSize: 12 }}>
          Reset demo ↻
        </Text>
      </Pressable>
    </View>
  );
}
function Navigation() {
  const { user, loading } = useAuth();
  useEffect(() => {
    const s = AppState.addEventListener("change", (state) =>
      focusManager.setFocused(state === "active"),
    );
    const n = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const screen = response.notification.request.content.data?.screen;
        if (screen === "community") router.push("/(tabs)/community");
        else router.push("/(tabs)");
      },
    );
    return () => {
      s.remove();
      n.remove();
    };
  }, []);
  if (loading)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          color={colors.mint}
          accessibilityLabel="Loading your account"
        />
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        animation:
          Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
      }}
    >
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="quests" options={{ title: "Quest log" }} />
        <Stack.Screen name="shop" options={{ title: "Equipment" }} />
        <Stack.Screen name="hero" options={{ title: "Your hero" }} />
        <Stack.Screen name="habits" options={{ title: "Habits" }} />
        <Stack.Screen name="progress" options={{ title: "Progress" }} />
        <Stack.Screen name="training-studio" options={{ title: "Training studio" }} />
        <Stack.Screen
          name="fitness-profile"
          options={{ title: "Fitness profile" }}
        />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="chat/[id]" options={{ title: "Chat" }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/callback" options={{ title: "Signing in" }} />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: DEMO && Platform.OS === "web" ? 1280 : undefined,
          alignSelf: "center",
          borderColor: colors.line,
          borderLeftWidth: DEMO ? 1 : 0,
          borderRightWidth: DEMO ? 1 : 0,
        }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <StatusBar style="light" />
              {DEMO && <DemoBanner />}
              <Navigation />
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </View>
    </View>
  );
}
