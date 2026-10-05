import { useEffect, useState } from "react";
import { Animated, AccessibilityInfo, View } from "react-native";
import Svg, {
  Circle,
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import type { Character } from "../lib/types";
export default function Hero({
  character,
  size = 200,
}: {
  character: Character;
  size?: number;
}) {
  const [pulse] = useState(() => new Animated.Value(0)),
    [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const s = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => s.remove();
  }, []);
  useEffect(() => {
    if (reduce || !character.animations) {
      pulse.setValue(0);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, character.animations, pulse]);
  const base =
    (
      {
        mint: "#4CE0CE",
        violet: "#B89AFF",
        amber: "#FFCB75",
        rose: "#FF91B2",
      } as Record<string, string>
    )[character.color] ?? "#4CE0CE";
  const color = character.skin?.includes("glacier")
    ? "#86DCFF"
    : character.skin?.includes("sun")
      ? "#FFCB75"
      : character.skin?.includes("midnight")
        ? "#7B83F5"
        : character.skin?.includes("prism")
          ? "#D1A6FF"
          : base;
  return (
    <View
      accessibilityLabel={`${character.name}, ${character.skin ?? "classic"} skin, ${character.weapon ?? "unarmed"}, ${character.trinket ?? "no accessories"}, ${character.vfx ?? "no effects"}`}
      style={{ alignItems: "center" }}
    >
      <Animated.View
        style={{
          opacity: pulse.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
          transform: [
            {
              translateY: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -4],
              }),
            },
          ],
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="armor" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} />
              <Stop offset="1" stopColor="#344A77" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="100" cy="183" rx="54" ry="8" fill="#050A14" />
          {character.aura && character.aura !== "none" && (
            <Circle
              cx="100"
              cy="102"
              r="75"
              stroke={color}
              strokeWidth="3"
              fill="none"
              opacity=".4"
            />
          )}
          {character.accessory === "cape" && (
            <Path d="M65 77L38 168L155 168L137 77" fill="#514680" />
          )}
          {character.trinket === "scoutpack" && (
            <Rect x="48" y="81" width="22" height="60" rx="8" fill={color} />
          )}
          <Path
            d="M78 137L74 175L91 175L101 139M111 138L113 175L133 175L126 136"
            fill="#324260"
          />
          <Path
            d="M69 75L61 128L83 145L124 145L140 120L132 77Z"
            fill="url(#armor)"
          />
          <Path
            d="M67 82L52 95L43 132L57 136L72 105M134 82L151 98L160 133L146 138L128 106"
            fill="#4B6287"
          />
          <Rect x="72" y="30" width="58" height="58" rx="20" fill="#52668E" />
          <Path d="M78 52L122 52L118 67L81 67Z" fill={color} />
          <Path d="M99 88L112 108L100 127L88 109Z" fill={color} />
          {character.trinket === "starvisor" && (
            <Rect x="69" y="48" width="65" height="12" rx="5" fill="#FFCB75" />
          )}
          {character.weapon && character.weapon !== "unarmed" && (
            <>
              <Path d="M154 143L166 73" stroke="#607598" strokeWidth="7" />
              <Path
                d={
                  character.weapon.includes("hammer")
                    ? "M150 72L150 55L181 59L178 81Z"
                    : character.weapon.includes("staff")
                      ? "M155 59L167 43L179 62L167 76Z"
                      : "M163 82L174 33L179 77L168 99Z"
                }
                fill={color}
              />
            </>
          )}
          {character.accessory === "crown" && (
            <Path
              d="M72 28L75 12L88 23L101 7L115 24L128 13L126 31Z"
              fill="#FFCB75"
            />
          )}
          {character.vfx &&
            character.vfx !== "no-vfx" &&
            [25, 45, 160, 178].map((x, i) => (
              <Circle
                key={x}
                cx={x}
                cy={80 + i * 25}
                r={i % 2 ? 3 : 5}
                fill={character.vfx?.includes("ember") ? "#FFAD75" : color}
              />
            ))}
          {character.accessory === "halo" && (
            <Ellipse
              cx="100"
              cy="19"
              rx="37"
              ry="10"
              stroke={color}
              strokeWidth="4"
              fill="none"
            />
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}
