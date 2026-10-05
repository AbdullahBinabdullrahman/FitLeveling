import { useEffect, useState, useId } from "react";
import { Animated, AccessibilityInfo, View, Pressable } from "react-native";
import Svg, {
  Circle,
  Path,
  Rect,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Ellipse,
  G,
} from "react-native-svg";
import { cosmeticById } from "../lib/cosmetics";
import type { Character as CharacterData } from "../lib/types";
export default function Hero({
  character,
  size = 220,
  level = 1,
}: {
  character: CharacterData;
  size?: number;
  level?: number;
}) {
  const id = useId().replace(/:/g, ""),
    [pulse] = useState(() => new Animated.Value(0)),
    [reduce, setReduce] = useState(false),
    [powered, setPowered] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduce,
    );
    return () => sub.remove();
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
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );
    a.start();
    return () => a.stop();
  }, [reduce, character.animations, pulse]);
  const color =
    (
      {
        mint: "#4ce0ce",
        violet: "#b89aff",
        amber: "#ffcb75",
        rose: "#ff91b2",
      } as Record<string, string>
    )[character.color] ?? "#4ce0ce";
  const skin = cosmeticById(character.skin ?? "default"),
    palette =
      skin?.slot === "skin" ? skin.colors : ["#edf5ff", "#b4c6e4", "#647497"];
  const aura = cosmeticById(character.aura ?? "none"),
    weapon = cosmeticById(character.weapon ?? "unarmed"),
    trinket = cosmeticById(character.trinket ?? "no-trinket"),
    vfx = cosmeticById(character.vfx ?? "no-vfx");
  const art = (
    <Svg
      width={size}
      height={(size * 340) / 320}
      viewBox="0 0 320 340"

      accessibilityLabel={`${character.name}, your level ${level} ${character.archetype} companion`}
    >
      <Defs>
        <LinearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor={palette[0]} />
          <Stop offset=".45" stopColor={palette[1]} />
          <Stop offset="1" stopColor={palette[2]} />
        </LinearGradient>
        <LinearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <Stop stopColor="#24354f" />
          <Stop offset="1" stopColor="#0a1023" />
        </LinearGradient>
        <RadialGradient id={`${id}-light`}>
          <Stop stopColor={color} stopOpacity=".45" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="160" cy="165" r="145" fill={`url(#${id}-light)`} />
      <G fill="none" stroke={color}>
        <Ellipse
          cx="160"
          cy="180"
          rx="137"
          ry="50"
          transform="rotate(-30 160 180)"
          strokeOpacity=".18"
        />
        <Circle cx="42" cy="206" r="5" fill={color} />
        <Circle cx="274" cy="109" r="3" fill={color} />
      </G>
      <Ellipse cx="160" cy="306" rx="70" ry="12" fill="#030818" opacity=".5" />
      {aura && (
        <G fill="none" stroke={aura.colors[1]} strokeWidth="2">
          {aura.id === "ion" ? (
            <>
              <Ellipse
                cx="160"
                cy="170"
                rx="122"
                ry="138"
                transform="rotate(25 160 170)"
              />
              <Ellipse
                cx="160"
                cy="170"
                rx="122"
                ry="138"
                transform="rotate(-25 160 170)"
                strokeDasharray="8 12"
              />
              <Circle cx="55" cy="96" r="5" fill={aura.colors[0]} />
              <Circle cx="266" cy="245" r="5" fill={aura.colors[0]} />
            </>
          ) : (
            <>
              {[
                [62, 78],
                [250, 92],
                [45, 232],
                [262, 268],
                [160, 30],
              ].map(([x, y]) => (
                <Path
                  key={x}
                  d={`M${x} ${y - 9}l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z`}
                  fill={aura.colors[0]}
                />
              ))}
              <Path
                d="M62 78L160 30L250 92M45 232L62 78M250 92L262 268"
                opacity=".3"
              />
            </>
          )}
        </G>
      )}
      {vfx && (
        <G fill="none" stroke={vfx.colors[1]} strokeWidth="2">
          {vfx.id === "ionpulse" ? (
            <>
              <Ellipse cx="160" cy="176" rx="135" ry="141" />
              <Ellipse cx="160" cy="176" rx="119" ry="126" />
            </>
          ) : (
            <>
              {[
                [60, 240],
                [265, 225],
                [77, 125],
                [244, 97],
                [46, 170],
                [270, 160],
              ].map(([x, y], i) => (
                <Circle
                  key={x}
                  cx={x}
                  cy={y}
                  r={i % 2 ? 3 : 5}
                  fill={vfx.colors[i % 3]}
                />
              ))}
            </>
          )}
        </G>
      )}
      <G>
        {trinket?.id === "scoutpack" && (
          <G fill="#263750" stroke={trinket.colors[1]} strokeWidth="2">
            <Rect x="96" y="155" width="25" height="75" rx="8" />
            <Rect x="199" y="155" width="25" height="75" rx="8" />
            <Path
              d="M99 230l10 25 10-25M201 230l10 25 10-25"
              fill={trinket.colors[0]}
              opacity=".7"
            />
          </G>
        )}
        {character.accessory === "cape" && (
          <Path
            d="M115 164 Q91 224 86 285 Q160 266 234 285 Q225 220 205 164Z"
            fill={color}
            fillOpacity=".55"
            stroke={color}
            strokeWidth="2"
          />
        )}
        {character.accessory === "halo" && (
          <Ellipse
            cx="160"
            cy="52"
            rx="49"
            ry="12"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
        )}
        <G>
          <Path
            d="M123 232L120 277Q118 291 135 291H149L153 236Z"
            fill={`url(#${id}-body)`}
          />
          <Path d="M120 278H148V294H116Q113 283 120 278" fill="#263650" />
          <Path
            d="M124 283H145"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </G>
        <G>
          <Path
            d="M167 236L171 290H190Q204 290 201 277L197 232Z"
            fill={`url(#${id}-body)`}
          />
          <Path d="M172 278H200Q209 284 204 294H172Z" fill="#263650" />
          <Path
            d="M178 283H197"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </G>
        <G>
          <Path
            d="M113 163Q87 169 80 211L92 232Q107 234 112 218L129 180Z"
            fill={`url(#${id}-body)`}
            stroke="#536484"
            strokeWidth="2"
          />
          <Path
            d="M87 218Q77 229 86 239Q99 246 108 233L103 219Z"
            fill="#293b55"
          />
          <Path
            d="M94 179L88 199"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </G>
        <G>
          <Path
            d="M207 163Q233 169 240 211L228 232Q213 234 208 218L191 180Z"
            fill={`url(#${id}-body)`}
            stroke="#536484"
            strokeWidth="2"
          />
          <Path
            d="M217 219L212 233Q220 246 234 239Q243 229 233 218Z"
            fill="#293b55"
          />
          <Path
            d="M227 179L233 199"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </G>
        <Path
          d="M122 153Q160 139 198 153L205 219Q203 241 180 245H140Q117 241 115 219Z"
          fill={`url(#${id}-body)`}
          stroke="#657795"
          strokeWidth="2"
        />
        <Path d="M133 164H187L190 210Q160 232 130 210Z" fill="#263750" />
        {skin?.pattern === "circuit" && (
          <G fill="none" stroke={color} strokeWidth="2">
            <Path d="M121 159l11 12v13M198 159l-11 12v13M132 211v13h12M187 211v13h-12" />
            <Circle cx="132" cy="184" r="3" />
            <Circle cx="187" cy="184" r="3" />
          </G>
        )}
        {skin?.pattern === "frost" && (
          <G stroke="#d6ffff" strokeWidth="2" fill="none">
            <Path d="M124 167l6 10-6 10M196 167l-6 10 6 10M160 216v13M154 219l12 7M166 219l-12 7" />
          </G>
        )}
        {skin?.pattern === "solar" && (
          <G stroke="#fff0b3" strokeWidth="2">
            <Path d="M124 164L129 203M196 164L191 203M145 157h30" />
          </G>
        )}
        {skin?.pattern === "armor" && (
          <G stroke="#8e7bcc" strokeWidth="3" fill="none">
            <Path d="M120 164l7 43M200 164l-7 43M120 226l10 7M200 226l-10 7" />
          </G>
        )}
        {skin?.pattern === "prism" && (
          <G fill="#f9ebff" opacity=".8">
            <Path d="M124 163l9 17-6 17-7-18ZM196 163l-9 17 6 17 7-18ZM154 221l6-9 6 9-6 9Z" />
          </G>
        )}
        <Path d="M127 225H193" stroke="#415574" strokeWidth="10" />
        <Circle
          cx="160"
          cy="193"
          r="19"
          fill={color}
          fillOpacity=".17"
          stroke={color}
          strokeWidth="2"
        />
        {character.archetype === "vanguard" ? (
          <Path d="M160 181L172 186V197L160 206L148 197V186Z" fill={color} />
        ) : character.archetype === "ranger" ? (
          <Path
            d="M150 201L171 182M155 182H172V198"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Path
            d="M160 178L165 188L177 193L165 198L160 209L155 198L143 193L155 188Z"
            fill={color}
          />
        )}
        <G>
          <Path
            d="M126 90L113 71L132 74L147 89"
            fill={color}
            stroke="#627a96"
            strokeWidth="2"
          />
          <Path
            d="M185 90L207 71L198 98"
            fill={color}
            stroke="#627a96"
            strokeWidth="2"
          />
          <Rect
            x="108"
            y="90"
            width="104"
            height="79"
            rx="32"
            fill={`url(#${id}-body)`}
            stroke="#7386a5"
            strokeWidth="2"
          />
          <Rect
            x="118"
            y="105"
            width="84"
            height="48"
            rx="20"
            fill={`url(#${id}-glass)`}
          />
          <Path
            d="M130 112Q160 106 188 114"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".15"
            strokeWidth="3"
          />
          <G fill={color}>
            <Rect x="135" y="122" width="10" height="15" rx="5" />
            <Rect x="175" y="122" width="10" height="15" rx="5" />
          </G>
          <Path
            d="M154 142Q160 147 166 142"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Circle cx="111" cy="128" r="7" fill="#405572" />
          <Circle cx="209" cy="128" r="7" fill="#405572" />
          {trinket?.id === "starvisor" && (
            <G fill="none" stroke={trinket.colors[1]} strokeWidth="3">
              <Path d="M121 116h77v26h-77Z" />
              <Path
                d="M185 117l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"
                fill={trinket.colors[0]}
              />
            </G>
          )}
          {character.accessory === "crown" && (
            <Path
              d="M134 91L131 65L146 76L160 58L174 76L189 65L186 91Z"
              fill="#ffcb75"
              stroke="#ffedbe"
              strokeWidth="2"
            />
          )}
        </G>
        {weapon && (
          <G stroke={weapon.colors[1]} strokeWidth="2" strokeLinejoin="round">
            {weapon.id === "ionblade" ? (
              <>
                <Path
                  d="M233 223l18-86 7-13 3 16-18 86Z"
                  fill={weapon.colors[0]}
                />
                <Path d="M224 221l27 6M236 224l-5 19" strokeWidth="6" />
                <Path d="M252 141l-16 76" stroke="#fff" opacity=".8" />
              </>
            ) : weapon.id === "sunhammer" ? (
              <>
                <Path d="M237 237l8-73" stroke="#654b31" strokeWidth="8" />
                <Path d="M224 145h48v28h-48l-8-14Z" fill={weapon.colors[2]} />
                <Circle cx="244" cy="159" r="9" fill={weapon.colors[0]} />
              </>
            ) : (
              <>
                <Path d="M240 253l10-102" strokeWidth="5" />
                <Path d="M250 112l15 21-17 23-13-23Z" fill={weapon.colors[0]} />
                <Path d="M250 112l-2 44M235 133h30" stroke={weapon.colors[2]} />
              </>
            )}
          </G>
        )}
        {level >= 5 && (
          <G stroke={color} strokeWidth="2">
            <Path d="M57 101V117M49 109H65M259 224V240M251 232H267" />
            <Path d="M252 69V79M247 74H257" />
          </G>
        )}
      </G>
    </Svg>
  );
  return (
    <View style={{ alignItems: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Energize ${character.name}`}
        onPress={() => setPowered((v) => !v)}
      >
        <Animated.View
          style={{
            transform: [
              {
                translateY: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -7],
                }),
              },
              { scale: powered && !reduce ? 1.04 : 1 },
            ],
          }}
        >
          {art}
        </Animated.View>
      </Pressable>
    </View>
  );
}
