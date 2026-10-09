import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  ScrollView,
  Animated,
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
import { useFocusEffect } from "expo-router";
import { useExperience } from "./Experience";
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
  scrollToTopKey,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  refresh?: () => void;
  refreshing?: boolean;
  scrollToTopKey?: number;
}) {
  const insets = useSafeAreaInsets();
  const { motion } = useExperience();
  const scroll = useRef<ScrollView>(null);
  const previousJump = useRef(scrollToTopKey);
  useEffect(() => {
    if (previousJump.current === scrollToTopKey) return;
    previousJump.current = scrollToTopKey;
    scroll.current?.scrollTo({ y: 0, animated: motion });
  }, [scrollToTopKey, motion]);
  const [reveal] = useState(() => new Animated.Value(1));
  useFocusEffect(
    useCallback(() => {
      reveal.setValue(motion ? 0 : 1);
      if (!motion) return;
      const animation = Animated.timing(reveal, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      });
      animation.start();
      return () => animation.stop();
    }, [motion, reveal]),
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scroll}
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
        <Animated.View
          style={{
            gap: 16,
            opacity: reveal,
            transform: [
              {
                translateY: reveal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          }}
        >
          <Text accessibilityRole="header" style={s.title}>
            {title}
          </Text>
          {subtitle && <Text style={s.muted}>{subtitle}</Text>}
          {children}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function ProgressMeter({
  value,
  color = colors.mint,
}: {
  value: number;
  color?: string;
}) {
  const { motion } = useExperience();
  const safeValue = Math.max(
    0,
    Math.min(100, Number.isFinite(value) ? value : 0),
  );
  const [progress] = useState(() => new Animated.Value(safeValue));
  useEffect(() => {
    if (!motion) {
      progress.setValue(safeValue);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: safeValue,
      duration: 400,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, safeValue, motion]);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeValue) }}
      style={{
        height: 6,
        backgroundColor: colors.line,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          height: 6,
          borderRadius: 8,
          backgroundColor: color,
          width: progress.interpolate({
            inputRange: [0, 100],
            outputRange: ["0%", "100%"],
          }),
        }}
      />
    </View>
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
  busy = false,
  selected,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  busy?: boolean;
  selected?: boolean;
}) {
  const { motion } = useExperience();
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!motion || disabled || busy) {
      scale.stopAnimation();
      scale.setValue(1);
    }
  }, [motion, disabled, busy, scale]);
  const press = (down: boolean) => {
    if (!motion) return;
    Animated.spring(scale, {
      toValue: down ? 0.96 : 1,
      speed: 32,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || busy, busy, selected }}
        disabled={disabled || busy}
        onPressIn={() => press(true)}
        onPressOut={() => press(false)}
        onPress={onPress}
        style={({ pressed }) => [
          s.button,
          secondary && s.secondary,
          (pressed || disabled || busy) && {
            opacity: disabled ? 0.45 : pressed ? 0.8 : 1,
          },
        ]}
      >
        {busy && (
          <ActivityIndicator color={secondary ? colors.text : colors.bg} />
        )}
        <Text style={[s.buttonText, secondary && { color: colors.text }]}>
          {busy ? "Working…" : title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.muted}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        placeholderTextColor={colors.muted}
        style={[
          s.input,
          props.multiline && { minHeight: 100, textAlignVertical: "top" },
          focused && { borderColor: colors.mint, backgroundColor: "#112632" },
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
  const { notify, begin, end } = useExperience();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [notice, updateNotice] = useState("");
  const setNotice = (text: string) => {
    updateNotice(text);
    if (text) notify(text);
  };
  async function run(task: () => Promise<void>, successMessage?: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    begin();
    setError(undefined);
    setNotice("");
    try {
      await task();
      if (successMessage) setNotice(successMessage);
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
      notify(e instanceof Error ? e.message : String(e), true);
    } finally {
      lock.current = false;
      setBusy(false);
      end();
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
    flexDirection: "row",
    gap: 8,
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
