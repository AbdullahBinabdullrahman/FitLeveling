import { View, useWindowDimensions } from "react-native";
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
  const { width } = useWindowDimensions();
  const q = useApi<{ catalog: Item[]; owned: string[] }>("cosmetics"),
    g = useApi<Game>("game"),
    economy = useApi<{ supply: number; availableRewards: number }>("economy"),
    refresh = useRefresh(),
    task = useTask(),
    [filter, setFilter] = useState("all"),
    [previewId, setPreviewId] = useState<string>(),
    [previewJump, setPreviewJump] = useState(0),
    [pendingId, setPendingId] = useState<string>();
  const preview = q.data?.catalog.find((item) => item.id === previewId);
  return (
    <Screen
      title="Find your look"
      scrollToTopKey={previewJump}
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
      {task.notice && <Body>{task.notice}</Body>}
      {g.data && (
        <Card>
          <Heading>
            {preview ? `Preview · ${preview.name}` : "Your equipped look"}
          </Heading>
          <Hero
            key={preview?.id ?? "equipped"}
            character={
              preview
                ? { ...g.data.character, [preview.slot]: preview.id }
                : g.data.character
            }
            level={g.data.stats.level}
            size={250}
            showEmotes
          />
          {preview && (
            <>
              <Body muted>{preview.description}</Body>
              <Body>
                {preview.rarity} · {preview.price} coins · Preview only
              </Body>
              <Button
                secondary
                title="Back to equipped look"
                onPress={() => setPreviewId(undefined)}
              />
            </>
          )}
        </Card>
      )}
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
            selected={filter === key}
            onPress={() => setFilter(key)}
          />
        ))}
      </Row>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
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
              <View key={i.id} style={{ width: width >= 900 ? "31%" : "100%" }}>
                <Card>
                  {g.data && (
                    <Hero
                      character={{
                        ...g.data.character,
                        [i.slot]: i.id,
                        animations: false,
                      }}
                      size={120}
                    />
                  )}
                  <Heading>{i.name}</Heading>
                  <Button
                    secondary
                    title={`Preview ${i.name}`}
                    selected={previewId === i.id}
                    onPress={() => {
                      setPreviewId(i.id);
                      setPreviewJump((n) => n + 1);
                    }}
                  />
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
                    busy={task.busy && pendingId === i.id}
                    disabled={
                      (task.busy && pendingId !== i.id) ||
                      equipped ||
                      (!owned && (g.data?.stats.coins ?? 0) < i.price)
                    }
                    onPress={() =>
                      task.run(async () => {
                        setPendingId(i.id);
                        try {
                          await api("cosmetics", "POST", {
                            action: owned ? "equip" : "buy",
                            itemId: i.id,
                          });
                          await refresh();
                          task.setNotice(
                            owned
                              ? `${i.name} equipped. Your hero is ready.`
                              : `${i.name} added to your collection. Equip it when you like.`,
                          );
                        } finally {
                          setPendingId(undefined);
                        }
                      })
                    }
                  />
                </Card>
              </View>
            );
          })}
      </View>
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
