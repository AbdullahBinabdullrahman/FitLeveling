export const SCORE_RULES = {
  training: 100,
  nutrition: 20,
  checkin: 20,
  cap: 3,
} as const;
export function weeklyScore(
  trainingDays: number,
  nutritionDays: number,
  checkinDays: number,
) {
  const cap = (n: number) => Math.min(3, Math.max(0, Math.floor(n)));
  return (
    cap(trainingDays) * 100 + cap(nutritionDays) * 20 + cap(checkinDays) * 20
  );
}
export function league(score: number) {
  return score >= 360
    ? "Orbit"
    : score >= 200
      ? "Momentum"
      : score >= 100
        ? "Spark"
        : "Explorer";
}
export type Cosmetic = {
  id: string;
  name: string;
  slot: "skin" | "aura" | "weapon" | "trinket" | "vfx";
  price: number;
  rarity: "Rare" | "Epic" | "Legendary";
  description: string;
  colors: [string, string, string];
  pattern: "armor" | "circuit" | "solar" | "frost" | "prism";
};
export const COSMETICS: Cosmetic[] = [
  {
    id: "midnight",
    name: "Midnight Sentinel",
    slot: "skin",
    price: 120,
    rarity: "Rare",
    description: "Obsidian armor. Electric violet circuits.",
    colors: ["#586080", "#262c46", "#0c1024"],
    pattern: "armor",
  },
  {
    id: "sunforge",
    name: "Sunforge",
    slot: "skin",
    price: 240,
    rarity: "Epic",
    description: "Forged in gold, powered by a solar core.",
    colors: ["#fff0b3", "#d79836", "#885319"],
    pattern: "solar",
  },
  {
    id: "glacier",
    name: "Glacier Runner",
    slot: "skin",
    price: 180,
    rarity: "Rare",
    description: "Ice blue plating and crystalline details.",
    colors: ["#e1fdff", "#7bcddd", "#3d749d"],
    pattern: "frost",
  },
  {
    id: "neon",
    name: "Neon Circuit",
    slot: "skin",
    price: 320,
    rarity: "Epic",
    description: "A dark chassis traced with luminous energy.",
    colors: ["#35496b", "#162b43", "#071321"],
    pattern: "circuit",
  },
  {
    id: "prism",
    name: "Prism Sovereign",
    slot: "skin",
    price: 600,
    rarity: "Legendary",
    description: "Iridescent armor for a journey all your own.",
    colors: ["#ffe1f5", "#b6a1f3", "#6576cb"],
    pattern: "prism",
  },
  {
    id: "starlight",
    name: "Starlight Orbit",
    slot: "aura",
    price: 150,
    rarity: "Rare",
    description: "A constellation of stars around your companion.",
    colors: ["#fff1bb", "#ffcc75", "#b993ff"],
    pattern: "solar",
  },
  {
    id: "ion",
    name: "Ion Field",
    slot: "aura",
    price: 280,
    rarity: "Epic",
    description: "Twin energy rings and a charged particle field.",
    colors: ["#b9fff4", "#4ce0ce", "#45a8f4"],
    pattern: "circuit",
  },
  {
    id: "ionblade",
    name: "Ion Saber",
    slot: "weapon",
    price: 220,
    rarity: "Rare",
    description: "A luminous energy blade with an ion edge.",
    colors: ["#d5ffff", "#4ce0ce", "#397b9a"],
    pattern: "circuit",
  },
  {
    id: "sunhammer",
    name: "Solar Hammer",
    slot: "weapon",
    price: 360,
    rarity: "Epic",
    description: "Golden forge plating around a radiant core.",
    colors: ["#fff0b3", "#ffcb75", "#885319"],
    pattern: "solar",
  },
  {
    id: "prismstaff",
    name: "Prism Staff",
    slot: "weapon",
    price: 520,
    rarity: "Legendary",
    description: "A floating prism crystal atop a cosmic staff.",
    colors: ["#ffe1f5", "#b89aff", "#6576cb"],
    pattern: "prism",
  },
  {
    id: "scoutpack",
    name: "Scout Jetpack",
    slot: "trinket",
    price: 160,
    rarity: "Rare",
    description: "Twin thrusters for your next adventure.",
    colors: ["#b9fff4", "#4ce0ce", "#263750"],
    pattern: "circuit",
  },
  {
    id: "starvisor",
    name: "Star Visor",
    slot: "trinket",
    price: 200,
    rarity: "Epic",
    description: "A golden star lens for a brighter mission.",
    colors: ["#fff0b3", "#ffcb75", "#885319"],
    pattern: "solar",
  },
  {
    id: "ionpulse",
    name: "Ion Pulse",
    slot: "vfx",
    price: 190,
    rarity: "Rare",
    description: "Soft energy pulses around your equipped hero.",
    colors: ["#b9fff4", "#4ce0ce", "#45a8f4"],
    pattern: "circuit",
  },
  {
    id: "embertrail",
    name: "Ember Sparks",
    slot: "vfx",
    price: 300,
    rarity: "Epic",
    description: "Warm sparks rise as your hero powers up.",
    colors: ["#fff0b3", "#ffcb75", "#ff9175"],
    pattern: "solar",
  },
];
export const cosmeticById = (id: string) =>
  COSMETICS.find((item) => item.id === id);

export const COSMETIC_SLOTS = [
  "skin",
  "aura",
  "weapon",
  "trinket",
  "vfx",
] as const;
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];
export function resolveCosmeticSlot(itemId: string): CosmeticSlot | undefined {
  if (itemId === "default") return "skin";
  if (itemId === "none") return "aura";
  if (itemId === "unarmed") return "weapon";
  if (itemId === "no-trinket") return "trinket";
  if (itemId === "no-vfx") return "vfx";
  return cosmeticById(itemId)?.slot;
}
