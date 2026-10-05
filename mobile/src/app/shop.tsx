import { useState } from "react";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import type { Game, Item } from "../lib/types";
import Hero from "../components/Hero";
import {
  Screen,
  Card,
  Heading,
  Body,
  Button,
  Row,
  Status,
  useTask,
} from "../components/ui";
export default function Shop() {
  const q = useApi<{ catalog: Item[]; owned: string[] }>("cosmetics"),
    g = useApi<Game>("game"),
    economy = useApi<{ supply: number; availableRewards: number }>("economy"),
    refresh = useRefresh(),
    task = useTask(),
    [filter, setFilter] = useState("all");
  return (
    <Screen
      title="Find your look"
      subtitle={`${g.data?.stats.coins ?? 0} coins · Earned through your journey`}
      refresh={() => q.refetch()}
      refreshing={q.isRefetching}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {economy.data && (
        <Body muted>
          {economy.data.supply.toLocaleString()} total game coins ·{" "}
          {economy.data.availableRewards.toLocaleString()} available for
          rewards. Equipment purchases replenish the reward bank.
        </Body>
      )}
      {g.data && <Hero character={g.data.character} />}
      <Row>
        {[
          ["all", "All"],
          ["skin", "Skins"],
          ["weapon", "Weapons"],
          ["trinket", "Accessories"],
          ["aura", "Auras"],
          ["vfx", "VFX"],
          ["owned", "My items"],
        ].map(([key, label]) => (
          <Button
            key={key}
            title={label}
            secondary={filter !== key}
            onPress={() => setFilter(key)}
          />
        ))}
      </Row>
      {q.data?.catalog
        .filter(
          (i) =>
            filter === "all" ||
            i.slot === filter ||
            (filter === "owned" && q.data!.owned.includes(i.id)),
        )
        .map((i) => {
          const owned = q.data!.owned.includes(i.id),
            equipped = g.data?.character[i.slot as "skin"] === i.id;
          return (
            <Card key={i.id}>
              {g.data && (
                <Hero
                  character={{ ...g.data.character, [i.slot]: i.id }}
                  size={120}
                />
              )}
              <Heading>{i.name}</Heading>
              <Body muted>{i.description}</Body>
              <Body>
                {i.rarity} · {i.price} coins
              </Body>
              <Button
                title={
                  equipped
                    ? "Equipped"
                    : owned
                      ? "Equip"
                      : `Unlock · ${i.price} coins`
                }
                disabled={
                  task.busy ||
                  equipped ||
                  (!owned && (g.data?.stats.coins ?? 0) < i.price)
                }
                onPress={() =>
                  task.run(async () => {
                    await api("cosmetics", "POST", {
                      action: owned ? "equip" : "buy",
                      itemId: i.id,
                    });
                    await refresh();
                  })
                }
              />
            </Card>
          );
        })}
      <Card>
        <Heading>Classic equipment</Heading>
        {Object.entries({
          skin: "default",
          aura: "none",
          weapon: "unarmed",
          trinket: "no-trinket",
          vfx: "no-vfx",
        }).map(([slot, itemId]) => (
          <Button
            key={slot}
            secondary
            title={`Reset ${slot}`}
            disabled={task.busy}
            onPress={() =>
              task.run(async () => {
                await api("cosmetics", "POST", { action: "equip", itemId });
                await refresh();
              })
            }
          />
        ))}
      </Card>
    </Screen>
  );
}
