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
  slot: "skin" | "aura";
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
];
export const cosmeticById = (id: string) =>
  COSMETICS.find((item) => item.id === id);
