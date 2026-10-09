import { router } from "expo-router";
import { useState } from "react";
import { useApi, useRefresh } from "../../lib/query";
import { api } from "../../lib/api";
import type { Workout } from "../../lib/types";
import {
  Screen,
  Card,
  Heading,
  Body,
  Field,
  Button,
  Status,
  useTask,
} from "../../components/ui";
function LogSet({
  exerciseId,
  setNumber,
  sessionId,
  saved,
  onSaved,
}: {
  exerciseId: string;
  setNumber: number;
  sessionId: string;
  saved?: { weightKg: string; reps: number };
  onSaved: () => Promise<void>;
}) {
  const [weight, setWeight] = useState(saved?.weightKg ?? ""),
    [reps, setReps] = useState(String(saved?.reps ?? "")),
    t = useTask();
  return (
    <Card>
      <Body>
        Set {setNumber}
        {saved ? " · Saved" : ""}
      </Body>
      <Field
        label="Weight (kg) · use 0 for bodyweight"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
      />
      <Field
        label="Reps"
        keyboardType="number-pad"
        value={reps}
        onChangeText={setReps}
      />
      <Status error={t.error} />
      <Button
        title={t.busy ? "Saving…" : saved ? "Update set" : "Save set"}
        disabled={t.busy || !weight || !reps}
        onPress={() =>
          t.run(async () => {
            await api("workouts", "PATCH", {
              sessionId,
              exerciseId,
              setNumber,
              weightKg: Number(weight),
              reps: Number(reps),
            });
            await onSaved();
          })
        }
      />
    </Card>
  );
}
export default function Train() {
  const q = useApi<Workout>("workouts"),
    refresh = useRefresh(),
    task = useTask(),
    [selected, setSelected] = useState(""),
    d = q.data;
  const active = d?.active,
    id = active?.templateId ?? selected;
  const days = Array.from(
    new Map(d?.plan.map((e) => [e.templateId, e.templateName]) ?? []),
  );
  return (
    <Screen
      title="Your training"
      subtitle="One set at a time. Your saved sets stay with you."
      refresh={() => q.refetch()}
      refreshing={q.isRefetching}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      <Button
        title="Daily check-in & plan editor"
        secondary
        onPress={() => router.push("/training-studio")}
      />
      {!active && (
        <>
          {days.map(([key, name]) => (
            <Button
              key={key}
              title={name}
              secondary={selected !== key}
              onPress={() => setSelected(key)}
            />
          ))}
          {d?.plan
            .filter((e) => e.templateId === selected)
            .map((e) => (
              <Card key={e.exerciseId}>
                <Heading>{e.exerciseName}</Heading>
                <Body muted>
                  {e.sets} sets × {e.repMin}–{e.repMax} reps
                </Body>
              </Card>
            ))}
          <Button
            title={task.busy ? "Starting…" : "Start workout"}
            disabled={!selected || task.busy}
            onPress={() =>
              task.run(async () => {
                await api("workouts", "POST", { templateId: selected });
                await refresh();
              })
            }
          />
        </>
      )}
      {active && (
        <>
          <Card>
            <Heading>
              {days.find(([key]) => key === id)?.[1] ?? "Active workout"}
            </Heading>
            <Body muted>
              Logged session · self-reported. Sensor verification is not active
              yet. Workout XP and coins are awarded once per day.
            </Body>
            <Body>{d?.activeSets.length ?? 0} sets saved</Body>
            <Button
              title={task.busy ? "Finishing…" : "Finish workout"}
              disabled={task.busy || (d?.activeSets.length ?? 0) < 3}
              onPress={() =>
                task.run(async () => {
                  const r = await api<{
                    xp: number;
                    coins: number;
                    rewardEligible?: boolean;
                  }>("workouts", "PUT", { sessionId: active.id });
                  task.setNotice(
                    `Workout saved · +${r.xp} XP · +${r.coins} coins${r.rewardEligible === false ? " · Daily workout reward already earned" : ""}`,
                  );
                  await refresh();
                })
              }
            />
          </Card>
          {d?.plan
            .filter((e) => e.templateId === id)
            .map((e) => (
              <Card key={e.exerciseId}>
                <Heading>{e.exerciseName}</Heading>
                <Body muted>
                  {e.sets} sets × {e.repMin}–{e.repMax} reps
                </Body>
                {d.past?.find((s) => s.exerciseId === e.exerciseId) && (
                  <Body muted>
                    Last session:{" "}
                    {
                      d.past.find((s) => s.exerciseId === e.exerciseId)!
                        .weightKg
                    }{" "}
                    kg ×{" "}
                    {d.past.find((s) => s.exerciseId === e.exerciseId)!.reps}{" "}
                    reps
                  </Body>
                )}
                {Array.from({ length: e.sets }, (_, i) => (
                  <LogSet
                    key={`${active.id}:${e.exerciseId}:${i}`}
                    exerciseId={e.exerciseId}
                    sessionId={active.id}
                    setNumber={i + 1}
                    saved={d.activeSets.find(
                      (s) =>
                        s.exerciseId === e.exerciseId && s.setNumber === i + 1,
                    )}
                    onSaved={refresh}
                  />
                ))}
              </Card>
            ))}
        </>
      )}
      <Heading>Recent workout history</Heading>
      {!d?.history?.length && (
        <Body muted>Your completed sessions will appear here.</Body>
      )}
      {d?.history?.slice(0, 10).map((session) => (
        <Card key={session.id}>
          <Heading>
            {days.find(([key]) => key === session.templateId)?.[1] ??
              "Completed workout"}
          </Heading>
          <Body muted>
            {new Date(
              session.completedAt ?? session.startedAt,
            ).toLocaleString()}
          </Body>
        </Card>
      ))}
    </Screen>
  );
}
