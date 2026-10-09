import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  AppState,
  Animated,
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApi } from "../lib/query";
import type { Game } from "../lib/types";

type Feedback = { text: string; error?: boolean; id: number };
const Context = createContext({
  motion: false,
  notify: (_text: string, _error = false) => {},
  begin: () => {},
  end: () => {},
});
export const useExperience = () => useContext(Context);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const game = useApi<Game>("game");
  const [reduce, setReduce] = useState(true);
  const [active, setActive] = useState(AppState.currentState !== "background");
  const [pending, setPending] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>();
  const serial = useRef(0);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (live) setReduce(value);
      })
      .catch(() => {});
    const reduceSub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    const appSub = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => {
      live = false;
      reduceSub.remove();
      appSub.remove();
    };
  }, []);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(
      () => setFeedback(undefined),
      feedback.error ? 7000 : 4500,
    );
    return () => clearTimeout(timer);
  }, [feedback]);
  const notify = useCallback((text: string, error = false) => {
    if (text) setFeedback({ text, error, id: ++serial.current });
  }, []);
  const begin = useCallback(() => setPending((n) => n + 1), []);
  const end = useCallback(() => setPending((n) => Math.max(0, n - 1)), []);
  const motion = !reduce && active && game.data?.character.animations !== false;
  const value = useMemo(
    () => ({ motion, notify, begin, end }),
    [motion, notify, begin, end],
  );
  return (
    <Context.Provider value={value}>
      {children}
      <FeedbackToast
        motion={motion}
        pending={pending > 0}
        feedback={feedback}
        dismiss={() => setFeedback(undefined)}
      />
    </Context.Provider>
  );
}
function FeedbackToast({
  motion,
  pending,
  feedback,
  dismiss,
}: {
  motion: boolean;
  pending: boolean;
  feedback?: Feedback;
  dismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [reveal] = useState(() => new Animated.Value(1));
  useEffect(() => {
    reveal.setValue(motion ? 0 : 1);
    if (!motion) return;
    const animation = Animated.timing(reveal, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reveal, motion, feedback?.id, pending]);
  if (!feedback && !pending) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: insets.bottom + 76,
        left: 18,
        right: 18,
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          opacity: reveal,
          transform: [
            {
              translateY: reveal.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
          width: "100%",
          maxWidth: 550,
          borderRadius: 18,
          backgroundColor: "#1A2B3D",
          borderWidth: 1,
          borderColor: feedback?.error ? "#FF9AAE" : "#4CE0CE",
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {pending ? (
          <ActivityIndicator color="#4CE0CE" accessibilityLabel="Working" />
        ) : (
          <Text
            style={{
              color: feedback?.error ? "#FF9AAE" : "#4CE0CE",
              fontSize: 20,
            }}
          >
            {feedback?.error ? "!" : "✓"}
          </Text>
        )}
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: "#F1F5FF", flex: 1, lineHeight: 21 }}
        >
          {pending ? "Working on it…" : feedback?.text}
        </Text>
        {!pending && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
            onPress={dismiss}
            hitSlop={12}
          >
            <Text style={{ color: "#F1F5FF", fontSize: 22 }}>×</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}
