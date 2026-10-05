import { useState, useRef, type ReactNode } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage } from "../lib/storage";
import * as Haptics from "expo-haptics";
export const colors = {
  bg: "#080E1A",
  card: "#141E30",
  line: "#26344D",
  text: "#F1F5FF",
  muted: "#9AAAC4",
  mint: "#4CE0CE",
  violet: "#B89AFF",
  error: "#FF9AAE",
};
export function Screen({
  children,
  title,
  subtitle,
  refresh,
  refreshing = false,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  refresh?: () => void;
  refreshing?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 20,
          paddingTop: Math.max(20, insets.top),
          paddingBottom: insets.bottom + 28,
          gap: 16,
        }}
        refreshControl={
          refresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.mint}
            />
          ) : undefined
        }
      >
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.muted}>{subtitle}</Text>}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export function Body({
  children,
  muted = false,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? s.muted : s.body}>{children}</Text>;
}
export function Heading({ children }: { children: ReactNode }) {
  return <Text style={s.heading}>{children}</Text>;
}
export function Row({ children }: { children: ReactNode }) {
  return <View style={s.row}>{children}</View>;
}
export function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled) && {
          opacity: disabled ? 0.45 : 0.8,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: colors.text }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        placeholderTextColor={colors.muted}
        style={[
          s.input,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Status({
  loading,
  error,
}: {
  loading?: boolean;
  error?: unknown;
}) {
  return (
    <>
      {loading && <ActivityIndicator color={colors.mint} />}{" "}
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error instanceof Error ? error.message : String(error)}
        </Text>
      )}
    </>
  );
}
export function useTask() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [notice, setNotice] = useState("");
  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      await task();
      try {
        if (
          Platform.OS !== "web" &&
          (await storage.getItem("fit-haptics")) !== "false"
        )
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
      } catch {}
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, notice, setNotice, run };
}
const s = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -1,
  },
  heading: { fontSize: 19, fontWeight: "700", color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 23 },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  button: {
    backgroundColor: colors.mint,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: { backgroundColor: colors.line },
  buttonText: { color: colors.bg, fontWeight: "700", fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
    minHeight: 50,
  },
  error: { color: colors.error, fontSize: 14, lineHeight: 21 },
});
