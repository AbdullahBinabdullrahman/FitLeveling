import { useState } from "react";
import { router } from "expo-router";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import type { Game } from "../lib/types";
import Hero from "../components/Hero";
import {
  Screen,
  Card,
  Heading,
  Body,
  Field,
  Button,
  Status,
  Row,
  useTask,
} from "../components/ui";
export default function HeroScreen() {
  const q = useApi<Game>("game"),
    refresh = useRefresh(),
    task = useTask(),
    [name, setName] = useState("");
  return (
    <Screen
      title="Your hero"
      refresh={() => q.refetch()}
      refreshing={q.isRefetching}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {q.data && (
        <Card>
          <Hero
            character={q.data.character}
            size={280}
            level={q.data.stats.level}
          />
          <Heading>
            {q.data.character.name} · Level {q.data.stats.level}
          </Heading>
          <Body muted>
            Skin: {q.data.character.skin ?? "default"} · Weapon:{" "}
            {q.data.character.weapon ?? "unarmed"}
          </Body>
          <Body muted>
            Accessory: {q.data.character.trinket ?? "none"} · VFX:{" "}
            {q.data.character.vfx ?? "none"}
          </Body>
          <Field
            label="Change hero name"
            value={name}
            placeholder={q.data.character.name}
            maxLength={24}
            onChangeText={setName}
          />
          <Button
            title="Save name"
            disabled={task.busy || name.trim().length < 2}
            onPress={() =>
              task.run(async () => {
                await api("game", "PATCH", {
                  ...q.data!.character,
                  name: name.trim(),
                });
                await refresh();
              })
            }
          />
          <Button
            title={
              q.data.character.animations
                ? "Turn off hero animations"
                : "Turn on hero animations"
            }
            secondary
            disabled={task.busy}
            onPress={() =>
              task.run(async () => {
                await api("game", "PATCH", {
                  ...q.data!.character,
                  animations: !q.data!.character.animations,
                });
                await refresh();
              })
            }
          />
          <Heading>Your class</Heading>
          <Row>
            {["vanguard", "ranger", "mystic"].map((archetype) => (
              <Button
                key={archetype}
                title={archetype}
                secondary={q.data!.character.archetype !== archetype}
                disabled={task.busy}
                onPress={() =>
                  task.run(async () => {
                    await api("game", "PATCH", {
                      ...q.data!.character,
                      archetype,
                    });
                    await refresh();
                  })
                }
              />
            ))}
          </Row>
          <Heading>Your signature color</Heading>
          <Row>
            {["mint", "violet", "amber", "rose"].map((color) => (
              <Button
                key={color}
                title={color}
                secondary={q.data!.character.color !== color}
                disabled={task.busy}
                onPress={() =>
                  task.run(async () => {
                    await api("game", "PATCH", { ...q.data!.character, color });
                    await refresh();
                  })
                }
              />
            ))}
          </Row>
          <Heading>Level-unlocked accessories</Heading>
          <Row>
            {[
              ["none", 0],
              ["cape", 3],
              ["halo", 5],
              ["crown", 10],
            ].map(([accessory, level]) => (
              <Button
                key={accessory}
                title={`${accessory}${q.data!.stats.level < Number(level) ? " · LV " + level : ""}`}
                secondary={q.data!.character.accessory !== accessory}
                disabled={task.busy || q.data!.stats.level < Number(level)}
                onPress={() =>
                  task.run(async () => {
                    await api("game", "PATCH", {
                      ...q.data!.character,
                      accessory,
                    });
                    await refresh();
                  })
                }
              />
            ))}
          </Row>
          <Button
            title="Explore equipment"
            onPress={() => router.push("/shop")}
          />
        </Card>
      )}
    </Screen>
  );
}
