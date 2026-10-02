"use client";
import { useId, useState, type CSSProperties } from "react";
import { cosmeticById } from "@/lib/community";
import { COLORS, type Character as CharacterData } from "@/lib/game";

type Mood = "idle" | "wave" | "power" | "celebrate";
export default function Character({
  character,
  level = 1,
  compact = false,
  interactive = true,
  mood: fixedMood,
}: {
  character: CharacterData;
  level?: number;
  compact?: boolean;
  interactive?: boolean;
  mood?: Mood;
}) {
  const id = useId().replace(/:/g, "");
  const [mood, setMood] = useState<Mood>("idle");
  const color =
    COLORS.find((c) => c.id === character.color)?.hex ?? COLORS[0].hex;
  const skin = cosmeticById(character.skin ?? "default");
  const palette =
    skin?.slot === "skin" ? skin.colors : ["#edf5ff", "#b4c6e4", "#647497"];
  const aura = cosmeticById(character.aura ?? "none");
  const currentMood = fixedMood ?? mood;
  const active = character.animations ? currentMood : "still";
  const style = { "--hero-color": color } as CSSProperties;
  const art = (
    <svg
      viewBox="0 0 320 340"
      className={`hero-art mood-${active}`}
      role="img"
      aria-label={`${character.name}, your level ${level} ${character.archetype} companion`}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={palette[0]} />
          <stop offset=".45" stopColor={palette[1]} />
          <stop offset="1" stopColor={palette[2]} />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#24354f" />
          <stop offset="1" stopColor="#0a1023" />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={color} stopOpacity=".45" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="165" r="145" fill={`url(#${id}-light)`} />
      <g className="hero-orbit" fill="none" stroke={color}>
        <ellipse
          cx="160"
          cy="180"
          rx="137"
          ry="50"
          transform="rotate(-30 160 180)"
          strokeOpacity=".18"
        />
        <circle cx="42" cy="206" r="5" fill={color} />
        <circle cx="274" cy="109" r="3" fill={color} />
      </g>
      <ellipse
        className="hero-shadow"
        cx="160"
        cy="306"
        rx="70"
        ry="12"
        fill="#030818"
        opacity=".5"
      />
      {aura && (
        <g
          className="cosmetic-aura"
          fill="none"
          stroke={aura.colors[1]}
          strokeWidth="2"
        >
          {aura.id === "ion" ? (
            <>
              <ellipse
                cx="160"
                cy="170"
                rx="122"
                ry="138"
                transform="rotate(25 160 170)"
              />
              <ellipse
                cx="160"
                cy="170"
                rx="122"
                ry="138"
                transform="rotate(-25 160 170)"
                strokeDasharray="8 12"
              />
              <circle cx="55" cy="96" r="5" fill={aura.colors[0]} />
              <circle cx="266" cy="245" r="5" fill={aura.colors[0]} />
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
                <path
                  key={x}
                  d={`M${x} ${y - 9}l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z`}
                  fill={aura.colors[0]}
                />
              ))}
              <path
                d="M62 78L160 30L250 92M45 232L62 78M250 92L262 268"
                opacity=".3"
              />
            </>
          )}
        </g>
      )}
      <g className="hero-body">
        {character.accessory === "cape" && (
          <path
            d="M115 164 Q91 224 86 285 Q160 266 234 285 Q225 220 205 164Z"
            fill={color}
            fillOpacity=".55"
            stroke={color}
            strokeWidth="2"
          />
        )}
        {character.accessory === "halo" && (
          <ellipse
            className="hero-halo"
            cx="160"
            cy="52"
            rx="49"
            ry="12"
            fill="none"
            stroke={color}
            strokeWidth="5"
          />
        )}
        <g className="hero-leg-left">
          <path
            d="M123 232L120 277Q118 291 135 291H149L153 236Z"
            fill={`url(#${id}-body)`}
          />
          <path d="M120 278H148V294H116Q113 283 120 278" fill="#263650" />
          <path
            d="M124 283H145"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <g className="hero-leg-right">
          <path
            d="M167 236L171 290H190Q204 290 201 277L197 232Z"
            fill={`url(#${id}-body)`}
          />
          <path d="M172 278H200Q209 284 204 294H172Z" fill="#263650" />
          <path
            d="M178 283H197"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
        <g className="hero-arm-left">
          <path
            d="M113 163Q87 169 80 211L92 232Q107 234 112 218L129 180Z"
            fill={`url(#${id}-body)`}
            stroke="#536484"
            strokeWidth="2"
          />
          <path
            d="M87 218Q77 229 86 239Q99 246 108 233L103 219Z"
            fill="#293b55"
          />
          <path
            d="M94 179L88 199"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <g className="hero-arm-right">
          <path
            d="M207 163Q233 169 240 211L228 232Q213 234 208 218L191 180Z"
            fill={`url(#${id}-body)`}
            stroke="#536484"
            strokeWidth="2"
          />
          <path
            d="M217 219L212 233Q220 246 234 239Q243 229 233 218Z"
            fill="#293b55"
          />
          <path
            d="M227 179L233 199"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
        <path
          d="M122 153Q160 139 198 153L205 219Q203 241 180 245H140Q117 241 115 219Z"
          fill={`url(#${id}-body)`}
          stroke="#657795"
          strokeWidth="2"
        />
        <path d="M133 164H187L190 210Q160 232 130 210Z" fill="#263750" />
        {skin?.pattern === "circuit" && (
          <g fill="none" stroke={color} strokeWidth="2">
            <path d="M121 159l11 12v13M198 159l-11 12v13M132 211v13h12M187 211v13h-12" />
            <circle cx="132" cy="184" r="3" />
            <circle cx="187" cy="184" r="3" />
          </g>
        )}
        {skin?.pattern === "frost" && (
          <g stroke="#d6ffff" strokeWidth="2" fill="none">
            <path d="M124 167l6 10-6 10M196 167l-6 10 6 10M160 216v13M154 219l12 7M166 219l-12 7" />
          </g>
        )}
        {skin?.pattern === "solar" && (
          <g stroke="#fff0b3" strokeWidth="2">
            <path d="M124 164L129 203M196 164L191 203M145 157h30" />
          </g>
        )}
        {skin?.pattern === "armor" && (
          <g stroke="#8e7bcc" strokeWidth="3" fill="none">
            <path d="M120 164l7 43M200 164l-7 43M120 226l10 7M200 226l-10 7" />
          </g>
        )}
        {skin?.pattern === "prism" && (
          <g fill="#f9ebff" opacity=".8">
            <path d="M124 163l9 17-6 17-7-18ZM196 163l-9 17 6 17 7-18ZM154 221l6-9 6 9-6 9Z" />
          </g>
        )}
        <path d="M127 225H193" stroke="#415574" strokeWidth="10" />
        <circle
          cx="160"
          cy="193"
          r="19"
          fill={color}
          fillOpacity=".17"
          stroke={color}
          strokeWidth="2"
        />
        {character.archetype === "vanguard" ? (
          <path d="M160 181L172 186V197L160 206L148 197V186Z" fill={color} />
        ) : character.archetype === "ranger" ? (
          <path
            d="M150 201L171 182M155 182H172V198"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M160 178L165 188L177 193L165 198L160 209L155 198L143 193L155 188Z"
            fill={color}
          />
        )}
        <g className="hero-head">
          <path
            d="M126 90L113 71L132 74L147 89"
            fill={color}
            stroke="#627a96"
            strokeWidth="2"
          />
          <path
            d="M185 90L207 71L198 98"
            fill={color}
            stroke="#627a96"
            strokeWidth="2"
          />
          <rect
            x="108"
            y="90"
            width="104"
            height="79"
            rx="32"
            fill={`url(#${id}-body)`}
            stroke="#7386a5"
            strokeWidth="2"
          />
          <rect
            x="118"
            y="105"
            width="84"
            height="48"
            rx="20"
            fill={`url(#${id}-glass)`}
          />
          <path
            d="M130 112Q160 106 188 114"
            fill="none"
            stroke="#ffffff"
            strokeOpacity=".15"
            strokeWidth="3"
          />
          <g className="hero-eyes" fill={color}>
            <rect x="135" y="122" width="10" height="15" rx="5" />
            <rect x="175" y="122" width="10" height="15" rx="5" />
          </g>
          <path
            d="M154 142Q160 147 166 142"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="111" cy="128" r="7" fill="#405572" />
          <circle cx="209" cy="128" r="7" fill="#405572" />
          {character.accessory === "crown" && (
            <path
              d="M134 91L131 65L146 76L160 58L174 76L189 65L186 91Z"
              fill="#ffcb75"
              stroke="#ffedbe"
              strokeWidth="2"
            />
          )}
        </g>
        {level >= 5 && (
          <g className="hero-sparks" stroke={color} strokeWidth="2">
            <path d="M57 101V117M49 109H65M259 224V240M251 232H267" />
            <path d="M252 69V79M247 74H257" />
          </g>
        )}
      </g>
    </svg>
  );
  return (
    <div
      className={`character-stage ${compact ? "compact" : ""}`}
      style={style}
    >
      {interactive ? (
        <button
          type="button"
          className="character-touch"
          aria-label={`Wave to ${character.name}`}
          onClick={() =>
            setMood((previous) => (previous === "wave" ? "idle" : "wave"))
          }
        >
          {art}
        </button>
      ) : (
        art
      )}
      {interactive && !compact && (
        <div className="hero-actions">
          <button
            type="button"
            onClick={() => setMood("wave")}
            aria-pressed={mood === "wave"}
          >
            Wave
          </button>
          <button
            type="button"
            onClick={() => setMood("power")}
            aria-pressed={mood === "power"}
          >
            Power up
          </button>
          <button
            type="button"
            onClick={() => setMood("celebrate")}
            aria-pressed={mood === "celebrate"}
          >
            Celebrate
          </button>
        </div>
      )}
    </div>
  );
}
