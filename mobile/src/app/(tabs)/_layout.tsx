import { Tabs, router } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../components/ui";
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
        },
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.muted,
        headerTitle: "FitLeveling",
        headerRight: () => (
          <Pressable
            accessibilityLabel="Account settings"
            onPress={() => router.push("/settings")}
            style={{ padding: 16 }}
          >
            <Ionicons name="settings-outline" size={23} color={colors.muted} />
          </Pressable>
        ),
      }}
    >
      {[
        ["index", "Home", "home-outline"],
        ["train", "Train", "barbell-outline"],
        ["coach", "Coach", "chatbubble-ellipses-outline"],
        ["community", "Community", "people-outline"],
        ["more", "More", "grid-outline"],
      ].map(([name, title, icon]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name={icon as "home-outline"}
                color={color}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
