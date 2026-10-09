"use client";
import { useEffect, useState, useRef } from "react";
import { Coins, Check, Sparkles, LockKeyhole } from "lucide-react";
import { COSMETICS, type Cosmetic } from "@/lib/community";
import type { GameData } from "@/lib/game";
import Character from "./Character";
export default function CosmeticShop({
  game,
  onChange,
}: {
  game: GameData;
  onChange: () => Promise<void>;
}) {
  const featureRef = useRef<HTMLElement>(null);
  const [owned, setOwned] = useState<string[]>([]),
    [loaded, setLoaded] = useState(false),
    [filter, setFilter] = useState("all"),
    [preview, setPreview] = useState<Cosmetic>(COSMETICS[0]),
    [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    const res = await fetch("/api/cosmetics");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setOwned(data.owned);
    setLoaded(true);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  async function action(itemId: string, action: "buy" | "equip") {
    setPending(itemId);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
      await onChange();
      setNotice(
        action === "buy"
          ? "Added to your collection. Equip it whenever you like."
          : "Your companion’s look is updated.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update collection");
    } finally {
      setPending("");
    }
  }
  const equipped = (item: Cosmetic) => game.character[item.slot] === item.id;
  const character = { ...game.character, [preview.slot]: preview.id };
  const visible = COSMETICS.filter(
    (item) =>
      filter === "all" ||
      (filter === "owned" && owned.includes(item.id)) ||
      filter === item.slot,
  );
  return (
    <div className="screen-enter cosmetic-shop">
      <div className="section-heading">
        <div>
          <div className="label text-violet-300">The collection</div>
          <h2>Make your hero yours.</h2>
          <p className="muted">
            Earn through your journey. Spend on a look you love.
          </p>
        </div>
        <span className="coin-balance">
          <Coins size={18} />
          {game.stats.coins} coins
        </span>
      </div>
      {error && (
        <p className="community-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="save-toast" role="status">
          {notice}
        </p>
      )}
      <section
        ref={featureRef}
        className={`collection-feature rarity-${preview.rarity.toLowerCase()}`}
      >
        <div key={preview.id} className="collection-preview preview-reveal">
          <Character character={character} level={game.stats.level} />
        </div>
        <div className="collection-feature-copy">
          <span className="rarity-badge">
            {preview.rarity} · {preview.slot}
          </span>
          <h3>{preview.name}</h3>
          <p>{preview.description}</p>
          <div className="flex gap-2 mt-4">
            {preview.colors.map((c) => (
              <span key={c} className="palette-dot" style={{ background: c }} />
            ))}
          </div>
          <p className="muted text-xs mt-5">
            Preview only. Unlock once, keep forever. Cosmetics don’t change your
            score.
          </p>
          <button
            className="btn mt-5"
            disabled={
              !loaded ||
              !!pending ||
              equipped(preview) ||
              (!owned.includes(preview.id) && game.stats.coins < preview.price)
            }
            onClick={() =>
              action(preview.id, owned.includes(preview.id) ? "equip" : "buy")
            }
          >
            {pending === preview.id
              ? "Saving…"
              : equipped(preview)
                ? "Equipped"
                : owned.includes(preview.id)
                  ? "Equip from inventory"
                  : `Unlock · ${preview.price} coins`}
          </button>
        </div>
      </section>
      <div className="collection-toolbar">
        <div className="collection-filters">
          {[
            ["all", "All items"],
            ["skin", "Skins"],
            ["aura", "Auras"],
            ["weapon", "Weapons"],
            ["trinket", "Accessories"],
            ["vfx", "VFX"],
            ["owned", "My inventory"],
          ].map(([id, label]) => (
            <button
              className={filter === id ? "selected" : ""}
              aria-pressed={filter === id}
              key={id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="muted text-sm">
          {owned.length} / {COSMETICS.length} collected
        </span>
      </div>
      {!visible.length && (
        <div className="card collection-empty" role="status">
          <Sparkles size={28} />
          <h3>Your collection starts here.</h3>
          <p className="muted">
            Choose an item to preview its look. Earn coins through quests and
            training.
          </p>
          <button className="btn" onClick={() => setFilter("all")}>
            Explore all items
          </button>
        </div>
      )}
      <div key={filter} className="collection-grid collection-reveal">
        {visible.map((item) => (
          <article
            className={`collectible rarity-${item.rarity.toLowerCase()} ${preview.id === item.id ? "previewing" : ""}`}
            key={item.id}
          >
            <button
              className="collectible-art"
              aria-label={`Preview ${item.name}`}
              aria-pressed={preview.id === item.id}
              onClick={() => {
                setPreview(item);
                featureRef.current?.scrollIntoView({
                  block: "start",
                  behavior:
                    game.character.animations &&
                    !window.matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                      ? "smooth"
                      : "auto",
                });
              }}
            >
              <Character
                character={{
                  ...game.character,
                  [item.slot]: item.id,
                  animations: false,
                }}
                compact
                interactive={false}
              />
              <span className="rarity-badge">{item.rarity}</span>
            </button>
            <div className="collectible-copy">
              <span className="label">{item.slot}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="collectible-footer">
                <span>
                  {owned.includes(item.id) ? (
                    <>
                      <Check size={14} /> Owned
                    </>
                  ) : (
                    <>
                      <Coins size={14} />
                      {item.price}
                    </>
                  )}
                </span>
                <button
                  className="ghost btn-small"
                  disabled={
                    !loaded ||
                    !!pending ||
                    equipped(item) ||
                    (!owned.includes(item.id) && game.stats.coins < item.price)
                  }
                  onClick={() =>
                    action(item.id, owned.includes(item.id) ? "equip" : "buy")
                  }
                >
                  {equipped(item) ? (
                    "Equipped"
                  ) : pending === item.id ? (
                    "Saving…"
                  ) : owned.includes(item.id) ? (
                    "Equip"
                  ) : game.stats.coins < item.price ? (
                    <>
                      <LockKeyhole size={13} /> Locked
                    </>
                  ) : (
                    "Unlock"
                  )}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {loaded && !visible.length && (
        <section className="card text-center">
          <Sparkles className="mx-auto text-violet-300" />
          <h3 className="font-bold mt-3">Your collection starts here</h3>
          <p className="muted mt-2">
            Complete quests to earn coins, then choose your first item.
          </p>
          <button className="ghost mt-4" onClick={() => setFilter("all")}>
            Explore items
          </button>
        </section>
      )}
      <div className="flex flex-wrap gap-3 mt-5">
        <button
          className="ghost"
          disabled={!!pending || !loaded}
          onClick={() => action("default", "equip")}
        >
          Equip classic skin
        </button>
        {[
          ["unarmed", "Remove weapon"],
          ["no-trinket", "Remove accessory"],
          ["no-vfx", "Remove VFX"],
        ].map(([id, label]) => (
          <button
            className="ghost"
            key={id}
            disabled={!!pending || !loaded}
            onClick={() => action(id, "equip")}
          >
            {label}
          </button>
        ))}
        <button
          className="ghost"
          disabled={!!pending || !loaded}
          onClick={() => action("none", "equip")}
        >
          Remove aura
        </button>
      </div>
    </div>
  );
}
