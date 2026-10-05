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
