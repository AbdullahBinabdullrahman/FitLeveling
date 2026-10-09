import Svg, { Polyline, Line } from "react-native-svg";
import { useState } from "react";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import type { Game, Workout } from "../lib/types";
import {
  Screen,
  Card,
  Heading,
  Body,
  Field,
  Button,
  Status,
  useTask,
} from "../components/ui";
function WeightTrend({
  values,
}: {
  values: { weightKg: string; measuredAt: string }[];
}) {
  const samples = [...values].reverse().slice(-30),
    weights = samples.map((s) => Number(s.weightKg));
  if (samples.length < 2)
    return <Body muted>Log two weight check-ins to see your trend.</Body>;
  const low = Math.min(...weights) - 0.5,
    high = Math.max(...weights) + 0.5;
  const points = weights
    .map(
      (w, i) =>
        `${12 + (i * 296) / (weights.length - 1)},${115 - ((w - low) / (high - low)) * 95}`,
    )
    .join(" ");
  return (
    <>
      <Svg
        width="100%"
        height={140}
        viewBox="0 0 320 140"
        accessibilityLabel="Weight history trend"
      >
        <Line x1={12} y1={115} x2={308} y2={115} stroke="#394563" />
        <Polyline
          points={points}
          fill="none"
          stroke="#4ce0ce"
          strokeWidth={3}
        />
      </Svg>
      <Body muted>
        {samples[0].weightKg} → {samples.at(-1)!.weightKg} kg · {samples.length}{" "}
        check-ins
      </Body>
    </>
  );
}
export default function Progress() {
  const w = useApi<{ weights: { weightKg: string; measuredAt: string }[] }>(
      "weight",
    ),
    n = useApi<{ logs: { day: string; calories: number; proteinG: number }[] }>(
      "nutrition",
    ),
    g = useApi<Game>("game"),
    profile = useApi<Workout>("workouts"),
    refresh = useRefresh(),
    task = useTask(),
    [weight, setWeight] = useState(""),
    [calories, setCalories] = useState(""),
    [protein, setProtein] = useState("");
  return (
    <Screen
      title="Your progress"
      subtitle="Look for patterns, not perfect days."
      refresh={() => refresh()}
    >
      <Status loading={w.isPending} error={w.error ?? n.error ?? task.error} />
      <Card>
        <Heading>Your journey at a glance</Heading>
        <Body>
          {g.data?.stats.weeklyWorkouts ?? 0} workouts this week ·{" "}
          {g.data?.stats.nutritionDays ?? 0} fuel check-ins
        </Body>
        <Body muted>
          Level {g.data?.stats.level ?? 1} ·{" "}
          {g.data?.stats.lifetimeXp?.toLocaleString() ?? 0} lifetime XP
        </Body>
      </Card>
      <Card>
        <Heading>Weight trend</Heading>
        <WeightTrend values={w.data?.weights ?? []} />
      </Card>
      <Card>
        <Heading>Weight check-in</Heading>
        <Field
          label="Current weight (kg)"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <Button
          title="Save weight"
          disabled={task.busy || !weight}
          onPress={() =>
            task.run(async () => {
              await api("weight", "POST", { weightKg: Number(weight) });
              setWeight("");
              await refresh();
            })
          }
        />
        {w.data?.weights.slice(0, 8).map((v, i) => (
          <Body muted key={i}>
            {new Date(v.measuredAt).toLocaleDateString()} · {v.weightKg} kg
          </Body>
        ))}
      </Card>
      <Card>
        <Heading>Today’s nutrition</Heading>
        <Body muted>
          Target: {profile.data?.profile.calorieTarget ?? "—"} kcal ·{" "}
          {profile.data?.profile.proteinMin ?? "—"}–
          {profile.data?.profile.proteinMax ?? "—"}g protein
        </Body>
        <Field
          label="Total calories today"
          keyboardType="number-pad"
          value={calories}
          onChangeText={setCalories}
        />
        <Field
          label="Total protein (g)"
          keyboardType="decimal-pad"
          value={protein}
          onChangeText={setProtein}
        />
        <Button
          title="Save today’s total"
          disabled={task.busy || !calories || !protein || !g.data}
          onPress={() =>
            task.run(async () => {
              await api("nutrition", "POST", {
                day: g.data!.today,
                calories: Number(calories),
                proteinG: Number(protein),
              });
              await refresh();
            })
          }
        />
        {n.data?.logs.slice(0, 8).map((v) => (
          <Body muted key={v.day}>
            {v.day} · {v.calories} kcal · {v.proteinG}g protein
          </Body>
        ))}
      </Card>
    </Screen>
  );
}
