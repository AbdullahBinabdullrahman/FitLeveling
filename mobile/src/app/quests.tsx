import { useState } from "react";
import { View } from "react-native";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import type { Game } from "../lib/types";
import {
  Screen,
  Card,
  Heading,
  Body,
  Row,
  Button,
  Status,
  useTask,
  colors,
} from "../components/ui";
export default function Quests() {
  const q = useApi<Game>("game"),
    refresh = useRefresh(),
    task = useTask(),
    [filter, setFilter] = useState("all");
  return (
    <Screen
      title="Your quest log"
      subtitle="Daily wins. Weekly adventures. Milestones that stay with you."
      refresh={() => refresh()}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      <Row>
        {["all", "daily", "weekly", "achievement"].map((v) => (
          <Button
            key={v}
            title={v}
            secondary={filter !== v}
            onPress={() => setFilter(v)}
          />
        ))}
      </Row>
      {q.data?.quests
        .filter((v) => filter === "all" || v.kind === filter)
        .map((v) => (
          <Card key={v.id}>
            <Body muted>
              {v.kind.toUpperCase()} ·{" "}
              {v.claimed
                ? "COMPLETED"
                : v.current >= v.target
                  ? "REWARD READY"
                  : "IN PROGRESS"}
            </Body>
            <Heading>{v.title}</Heading>
            <Body muted>{v.description}</Body>
            <View
              style={{
                height: 7,
                backgroundColor: colors.line,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 7,
                  width: `${Math.min(100, (v.current / v.target) * 100)}%`,
                  backgroundColor: colors.violet,
                }}
              />
            </View>
            <Row>
              <Body>
                {Math.min(v.current, v.target)} / {v.target}
              </Body>
              <Body>
                ⚡ {v.xp} XP · ◈ {v.coins} coins
              </Body>
            </Row>
            <Button
              title={v.claimed ? "Reward collected" : "Collect reward"}
              disabled={task.busy || v.claimed || v.current < v.target}
              onPress={() =>
                task.run(async () => {
                  await api("game", "POST", { questId: v.id });
                  task.setNotice("Reward collected.");
                  await refresh();
                })
              }
            />
          </Card>
        ))}
    </Screen>
  );
}
