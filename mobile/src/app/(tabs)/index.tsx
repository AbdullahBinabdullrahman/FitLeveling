import { router } from "expo-router";
import { useApi, useRefresh } from "../../lib/query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Game } from "../../lib/types";
import Hero from "../../components/Hero";
import {
  Screen,
  Card,
  Heading,
  Body,
  Button,
  Row,
  Status,
  useTask,
} from "../../components/ui";
export default function Home() {
  const { user } = useAuth(),
    q = useApi<Game>("game"),
    refresh = useRefresh(),
    task = useTask(),
    g = q.data;
  return (
    <Screen
      title={`Hey, ${user?.name.split(" ")[0] ?? "explorer"}.`}
      subtitle="A little progress, at your pace."
      refresh={() => q.refetch()}
      refreshing={q.isRefetching}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {g && (
        <>
          <Card>
            <Hero character={g.character} />
            <Heading>
              {g.character.name} · Level {g.stats.level}
            </Heading>
            <Row>
              <Body>{g.stats.coins} coins</Body>
              <Body muted>{g.stats.weeklyWorkouts} workouts this week</Body>
            </Row>
            <Button
              title={
                g.stats.todayWorkouts
                  ? "Continue your training"
                  : "Start today’s workout"
              }
              onPress={() => router.push("/(tabs)/train")}
            />
            <Button
              title="Talk to your coach"
              secondary
              onPress={() => router.push("/(tabs)/coach")}
            />
          </Card>
          <Heading>Today’s small wins</Heading>
          {g.quests
            .filter((v) => v.kind !== "achievement")
            .map((v) => (
              <Card key={v.id}>
                <Heading>{v.title}</Heading>
                <Body muted>{v.description}</Body>
                <Body>
                  {Math.min(v.current, v.target)} / {v.target} · {v.xp} XP ·{" "}
                  {v.coins} coins
                </Body>
                <Button
                  title={
                    v.claimed
                      ? "Claimed"
                      : v.current >= v.target
                        ? "Collect reward"
                        : "Keep going"
                  }
                  disabled={task.busy || v.claimed || v.current < v.target}
                  onPress={() =>
                    task.run(async () => {
                      await api("game", "POST", { questId: v.id });
                      await refresh();
                    })
                  }
                />
              </Card>
            ))}
          <Row>
            <Button
              title="Habits"
              secondary
              onPress={() => router.push("/habits")}
            />
            <Button
              title="Equipment"
              secondary
              onPress={() => router.push("/shop")}
            />
          </Row>
        </>
      )}
    </Screen>
  );
}
