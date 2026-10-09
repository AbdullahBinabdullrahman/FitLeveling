"use client";
import { useId, useState, useEffect, type CSSProperties } from "react";
import {
  HERO_JOINTS,
  JOINT_PARENTS,
  jointWorld,
  jointRotation,
  blendPose,
  dancePose,
  type HeroPose,
  type HeroJoint,
} from "@/lib/hero-rig";
import { cosmeticById } from "@/lib/community";
import { COLORS, type Character as CharacterData } from "@/lib/game";

type Mood =
  "idle" | "wave" | "power" | "celebrate" | "shuffle" | "robot" | "victory";
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
  const [pose, setPose] = useState<HeroPose>({}),
    [selectedJoint, setSelectedJoint] = useState<HeroJoint>("head"),
    [rigOpen, setRigOpen] = useState(false),
    [phase, setPhase] = useState(0);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(media.matches);
    const update = () => setReduce(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const movement = fixedMood ?? mood;
  useEffect(() => {
    if (
      reduce ||
      !character.animations ||
      !["shuffle", "robot", "victory", "wave", "celebrate"].includes(movement)
    )
      return;
    const started = Date.now();
    const tick = setInterval(() => setPhase((Date.now() - started) / 1000), 50);
    return () => clearInterval(tick);
  }, [movement, reduce, character.animations]);
  const rigPose = blendPose(
    pose,
    reduce || !character.animations ? {} : dancePose(movement, phase),
  );
  const jointInfo = HERO_JOINTS.find((j) => j[0] === selectedJoint)!;
  const adjustJoint = (degrees: number) =>
    setPose((old) => ({
      ...old,
      [selectedJoint]: Math.max(jointInfo[4], Math.min(jointInfo[5], degrees)),
    }));
  const color =
    COLORS.find((c) => c.id === character.color)?.hex ?? COLORS[0].hex;
  const skin = cosmeticById(character.skin ?? "default");
  const palette =
    skin?.slot === "skin" ? skin.colors : ["#edf5ff", "#b4c6e4", "#647497"];
  const aura = cosmeticById(character.aura ?? "none");
  const weapon = cosmeticById(character.weapon ?? "unarmed");
  const trinket = cosmeticById(character.trinket ?? "no-trinket");
  const vfx = cosmeticById(character.vfx ?? "no-vfx");
  const currentMood = fixedMood ?? mood;
  const active = character.animations ? currentMood : "still";
  const style = { "--hero-color": color } as CSSProperties;
  const rigWeapon = weapon && (
    <g
      className="hero-weapon"
      stroke={weapon.colors[1]}
      strokeWidth="2"
      strokeLinejoin="round"
    >
      {weapon.id === "ionblade" ? (
        <>
          <path d="M233 223l18-86 7-13 3 16-18 86Z" fill={weapon.colors[0]} />
          <path d="M224 221l27 6M236 224l-5 19" strokeWidth="6" />
          <path d="M252 141l-16 76" stroke="#fff" opacity=".8" />
        </>
      ) : weapon.id === "voidreaper" ? (
        <>
          <path d="M238 260l10-123" strokeWidth="7" />
          <path
            d="M248 138C211 87 280 73 294 129C270 110 249 115 248 138Z"
            fill={weapon.colors[2]}
          />
          <path
            d="M248 138C232 100 276 91 294 129"
            fill="none"
            stroke={weapon.colors[0]}
            strokeWidth="4"
          />
        </>
      ) : weapon.id === "frostbow" ? (
        <>
          <path
            d="M236 124Q302 180 236 248Q272 180 236 124Z"
            fill={weapon.colors[2]}
          />
          <path
            d="M236 124L252 182L236 248M226 182h60l-8-7m8 7-8 7"
            fill="none"
            stroke={weapon.colors[0]}
          />
          <circle cx="252" cy="182" r="5" fill={weapon.colors[1]} />
        </>
      ) : weapon.id === "stormlance" ? (
        <>
          <path d="M237 260L252 143" strokeWidth="6" />
          <path d="M252 102l-17 49 17-11 13 12Z" fill={weapon.colors[0]} />
          <path
            d="M249 145l12 18-18 9 14 16-18 13"
            fill="none"
            strokeWidth="3"
          />
        </>
      ) : weapon.id === "novagauntlet" ? (
        <>
          <rect
            x="216"
            y="190"
            width="54"
            height="43"
            rx="12"
            fill={weapon.colors[2]}
          />
          <path
            d="M223 199h38M224 213h7m8 0h7m8 0h7"
            stroke={weapon.colors[0]}
            strokeWidth="4"
          />
          <circle cx="241" cy="224" r="9" fill={weapon.colors[1]} />
        </>
      ) : weapon.id === "sunhammer" ? (
        <>
          <path d="M237 237l8-73" stroke="#654b31" strokeWidth="8" />
          <path d="M224 145h48v28h-48l-8-14Z" fill={weapon.colors[2]} />
          <circle cx="244" cy="159" r="9" fill={weapon.colors[0]} />
        </>
      ) : (
        <>
          <path d="M240 253l10-102" strokeWidth="5" />
          <path d="M250 112l15 21-17 23-13-23Z" fill={weapon.colors[0]} />
          <path d="M250 112l-2 44M235 133h30" stroke={weapon.colors[2]} />
        </>
      )}
    </g>
  );
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
      {vfx && (
        <g
          className={`hero-vfx vfx-${vfx.id} ${character.animations ? "vfx-animated" : ""}`}
          fill="none"
          stroke={vfx.colors[1]}
          strokeWidth="2"
        >
          {vfx.id === "ionpulse" ? (
            <>
              <ellipse
                className="vfx-pulse"
                cx="160"
                cy="176"
                rx="135"
                ry="141"
              />
              <ellipse
                className="vfx-pulse delayed"
                cx="160"
                cy="176"
                rx="119"
                ry="126"
              />
            </>
          ) : vfx.id === "stormstrike" ? (
            <g className="vfx-lightning">
              <path d="M67 78l-17 42h23l-28 55M266 133l-21 37h25l-19 56M117 34l-9 22h15l-9 24" />
              <circle cx="62" cy="103" r="27" strokeOpacity=".2" />
            </g>
          ) : vfx.id === "galaxyspiral" ? (
            <g className="vfx-galaxy">
              <ellipse
                cx="160"
                cy="177"
                rx="138"
                ry="85"
                transform="rotate(-30 160 177)"
                strokeDasharray="55 20 8 20"
              />
              <ellipse
                cx="160"
                cy="177"
                rx="132"
                ry="82"
                transform="rotate(30 160 177)"
                strokeOpacity=".35"
              />
              <circle cx="46" cy="156" r="7" fill={vfx.colors[0]} />
              <circle cx="274" cy="199" r="5" fill={vfx.colors[2]} />
            </g>
          ) : vfx.id === "frostfall" ? (
            <g className="vfx-snow">
              {[
                [55, 88],
                [262, 113],
                [72, 205],
                [250, 254],
                [110, 41],
                [204, 56],
              ].map(([x, y], i) => (
                <path
                  key={x}
                  d={`M${x - 6} ${y}h12M${x} ${y - 6}v12M${x - 4} ${y - 4}l8 8M${x - 4} ${y + 4}l8-8`}
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
              ))}
            </g>
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
                <circle
                  className="vfx-spark"
                  key={x}
                  cx={x}
                  cy={y}
                  r={i % 2 ? 3 : 5}
                  fill={vfx.colors[i % 3]}
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </>
          )}
        </g>
      )}
      <g className="hero-body">
        <g transform={jointRotation("body", rigPose)}>
          {trinket?.id === "scoutpack" && (
            <g fill="#263750" stroke={trinket.colors[1]} strokeWidth="2">
              <rect x="96" y="155" width="25" height="75" rx="8" />
              <rect x="199" y="155" width="25" height="75" rx="8" />
              <path
                d="M99 230l10 25 10-25M201 230l10 25 10-25"
                fill={trinket.colors[0]}
                opacity=".7"
              />
            </g>
          )}
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

          <g transform={jointRotation("leftHip", rigPose)}>
            <path d="M123 232L123 264H151L153 236Z" fill={`url(#${id}-body)`} />
            <g transform={jointRotation("leftKnee", rigPose)}>
              <path
                d="M123 260L120 282H148L151 260Z"
                fill={`url(#${id}-body)`}
              />
              <g transform={jointRotation("leftAnkle", rigPose)}>
                <path d="M120 278H148V294H116Q113 283 120 278" fill="#263650" />
                <path
                  d="M124 283H145"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </g>
          <g transform={jointRotation("rightHip", rigPose)}>
            <path d="M167 236L170 264H199L197 232Z" fill={`url(#${id}-body)`} />
            <g transform={jointRotation("rightKnee", rigPose)}>
              <path
                d="M170 260L172 282H201L199 260Z"
                fill={`url(#${id}-body)`}
              />
              <g transform={jointRotation("rightAnkle", rigPose)}>
                <path d="M172 278H200Q209 284 204 294H172Z" fill="#263650" />
                <path
                  d="M178 283H197"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </g>
          <g transform={jointRotation("leftShoulder", rigPose)}>
            <path
              d="M113 163Q90 171 84 206L106 210L129 180Z"
              fill={`url(#${id}-body)`}
              stroke="#536484"
              strokeWidth="2"
            />
            <path
              d="M94 179L88 199"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g transform={jointRotation("leftElbow", rigPose)}>
              <path
                d="M84 200L80 215L92 232Q108 233 112 213L106 200Z"
                fill={`url(#${id}-body)`}
              />
              <g transform={jointRotation("leftWrist", rigPose)}>
                <path
                  d="M87 218Q77 229 86 239Q99 246 108 233L103 219Z"
                  fill="#293b55"
                />
              </g>
            </g>
          </g>
          <g transform={jointRotation("rightShoulder", rigPose)}>
            <path
              d="M207 163Q230 171 236 206L214 210L191 180Z"
              fill={`url(#${id}-body)`}
              stroke="#536484"
              strokeWidth="2"
            />
            <path
              d="M227 179L233 199"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <g transform={jointRotation("rightElbow", rigPose)}>
              <path
                d="M236 200L240 215L228 232Q212 233 208 213L214 200Z"
                fill={`url(#${id}-body)`}
              />
              <g transform={jointRotation("rightWrist", rigPose)}>
                <path
                  d="M217 219L212 233Q220 246 234 239Q243 229 233 218Z"
                  fill="#293b55"
                />
                {rigWeapon}
              </g>
            </g>
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
          <g className="hero-head" transform={jointRotation("head", rigPose)}>
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
            {trinket?.id === "starvisor" && (
              <g fill="none" stroke={trinket.colors[1]} strokeWidth="3">
                <path d="M121 116h77v26h-77Z" />
                <path
                  d="M185 117l3 6 6 3-6 3-3 6-3-6-6-3 6-3Z"
                  fill={trinket.colors[0]}
                />
              </g>
            )}
            {character.accessory === "crown" && (
              <path
                d="M134 91L131 65L146 76L160 58L174 76L189 65L186 91Z"
                fill="#ffcb75"
                stroke="#ffedbe"
                strokeWidth="2"
              />
            )}
            {trinket?.id === "beatphones" && (
              <g
                fill={trinket.colors[2]}
                stroke={trinket.colors[1]}
                strokeWidth="4"
              >
                <path d="M108 130C105 68 215 68 212 130" fill="none" />
                <rect x="98" y="113" width="17" height="34" rx="7" />
                <rect x="205" y="113" width="17" height="34" rx="7" />
              </g>
            )}
          </g>
          {level >= 5 && (
            <g className="hero-sparks" stroke={color} strokeWidth="2">
              <path d="M57 101V117M49 109H65M259 224V240M251 232H267" />
              <path d="M252 69V79M247 74H257" />
            </g>
          )}
        </g>
      </g>
      {rigOpen && (
        <g fill="none" stroke="#4ce0ce" strokeWidth="2">
          {HERO_JOINTS.map(([joint]) => {
            const [x, y] = jointWorld(joint, rigPose);
            const parent = JOINT_PARENTS[joint];
            const from = parent ? jointWorld(parent, rigPose) : [x, y];
            return (
              <g key={joint}>
                <path d={`M${from[0]} ${from[1]}L${x} ${y}`} />
                <circle
                  cx={x}
                  cy={y}
                  r={joint === selectedJoint ? 7 : 4}
                  fill={joint === selectedJoint ? "#ffcc75" : "#4ce0ce"}
                  stroke="#0a1023"
                />
              </g>
            );
          })}
        </g>
      )}
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
        <details
          className="hero-rig-panel"
          onToggle={(e) => {
            setRigOpen(e.currentTarget.open);
            setMood("idle");
          }}
        >
          <summary>Skeleton studio · control each part</summary>
          <p>
            14 joints. Equipment follows the hand. Pose changes are a local
            preview.
          </p>
          <label>
            Body part
            <select
              value={selectedJoint}
              onChange={(e) => {
                setSelectedJoint(e.target.value as HeroJoint);
                setMood("idle");
              }}
            >
              {HERO_JOINTS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {jointInfo[1]}: {pose[selectedJoint] ?? 0}°
            <input
              aria-label={`${jointInfo[1]} angle`}
              type="range"
              min={jointInfo[4]}
              max={jointInfo[5]}
              value={pose[selectedJoint] ?? 0}
              onChange={(e) => adjustJoint(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={() => setPose({})}>
            Reset pose
          </button>
        </details>
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
          {[
            ["shuffle", "Shuffle"],
            ["robot", "Robot dance"],
            ["victory", "Victory dance"],
            ["idle", "Stop"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMood(value as Mood)}
              aria-pressed={mood === value}
              disabled={!character.animations}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
