import { useState } from "react";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import type { Game, Proposal } from "../lib/types";
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
type Plan = Extract<Proposal, { type: "training" }>["plan"];
type Context = {
  profile: { goal: string };
  currentPlan: Plan;
  versions: { id: string }[];
  checkins: {
    day: string;
    energy: number;
    sleepHours: string;
    notes: string;
  }[];
};
const exercise = () => ({
  name: "",
  muscleGroup: "",
  sets: 3,
  repMin: 8,
  repMax: 12,
});
export default function TrainingStudio() {
  const q = useApi<Context>("coach/training"),
    g = useApi<Game>("game"),
    refresh = useRefresh(),
    task = useTask();
  const [energy, setEnergy] = useState("3"),
    [sleep, setSleep] = useState("7"),
    [notes, setNotes] = useState(""),
    [preferences, setPreferences] = useState(""),
    [goal, setGoal] = useState("");
  const [draft, setDraft] = useState<Plan | null>(null),
    [base, setBase] = useState<string | null>(null);
  function editExercise(
    di: number,
    ei: number,
    key: string,
    value: string | number,
  ) {
    setDraft((old) =>
      old
        ? {
            ...old,
            days: old.days.map((d, i) =>
              i !== di
                ? d
                : {
                    ...d,
                    exercises: d.exercises.map((e, j) =>
                      j !== ei ? e : { ...e, [key]: value },
                    ),
                  },
            ),
          }
        : null,
    );
  }
  return (
    <Screen
      title="Training studio"
      subtitle="Daily recovery notes and your complete future rotation."
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      <Card>
        <Heading>Daily check-in</Heading>
        <Body muted>Your notes help the coach understand what changed.</Body>
        <Row>
          {["lose", "maintain", "gain"].map((v) => (
            <Button
              key={v}
              title={v}
              secondary={(goal || q.data?.profile.goal) !== v}
              onPress={() => setGoal(v)}
            />
          ))}
        </Row>
        <Field
          label="Energy · 1 to 5"
          keyboardType="number-pad"
          value={energy}
          onChangeText={setEnergy}
        />
        <Field
          label="Sleep hours · 0 to 24"
          keyboardType="decimal-pad"
          value={sleep}
          onChangeText={setSleep}
        />
        <Field
          label="How are you feeling?"
          multiline
          value={notes}
          onChangeText={setNotes}
          maxLength={2000}
        />
        <Field
          label="What would you like to try?"
          multiline
          value={preferences}
          onChangeText={setPreferences}
          maxLength={1000}
        />
        <Button
          title="Save daily check-in"
          disabled={task.busy || !q.data || !g.data}
          onPress={() =>
            task.run(async () => {
              await api("coach/training", "PATCH", {
                day: g.data!.today,
                goal: goal || q.data!.profile.goal,
                energy: Number(energy),
                sleepHours: Number(sleep),
                notes,
                preferences,
              });
              task.setNotice("Check-in saved. Your coach can use these notes.");
              await refresh();
            })
          }
        />
        {q.data?.checkins.slice(0, 3).map((c) => (
          <Body muted key={c.day}>
            {c.day} · energy {c.energy}/5 · {c.sleepHours}h sleep · {c.notes}
          </Body>
        ))}
      </Card>
      <Card>
        <Heading>Your training rotation</Heading>
        <Body muted>
          Review every day before saving. Completed workouts stay in your
          history.
        </Body>
        <Button
          title={
            draft ? "Reload current plan (discard draft)" : "Edit current plan"
          }
          disabled={!q.data || task.busy}
          onPress={() => {
            setDraft(JSON.parse(JSON.stringify(q.data!.currentPlan)));
            setBase(q.data!.versions[0]?.id ?? null);
          }}
        />
        {!draft &&
          q.data?.currentPlan.days.map((d, i) => (
            <Body key={i}>
              {d.name} · {d.exercises.map((e) => e.name).join(", ")}
            </Body>
          ))}
      </Card>
      {draft && (
        <>
          <Field
            label="Why change your plan?"
            value={draft.rationale}
            onChangeText={(rationale) => setDraft({ ...draft, rationale })}
          />
          {draft.days.map((d, di) => (
            <Card key={di}>
              <Field
                label={`Day ${di + 1} name`}
                value={d.name}
                onChangeText={(name) =>
                  setDraft({
                    ...draft,
                    days: draft.days.map((v, i) =>
                      i === di ? { ...v, name } : v,
                    ),
                  })
                }
              />
              {d.exercises.map((e, ei) => (
                <Card key={ei}>
                  <Field
                    label="Exercise"
                    value={e.name}
                    onChangeText={(v) => editExercise(di, ei, "name", v)}
                  />
                  <Field
                    label="Muscle group"
                    value={e.muscleGroup}
                    onChangeText={(v) => editExercise(di, ei, "muscleGroup", v)}
                  />
                  {[
                    ["sets", "Sets · 1–6"],
                    ["repMin", "Minimum reps · 1–30"],
                    ["repMax", "Maximum reps · 1–30"],
                  ].map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      keyboardType="number-pad"
                      value={String(e[key as "sets" | "repMin" | "repMax"])}
                      onChangeText={(v) => editExercise(di, ei, key, Number(v))}
                    />
                  ))}
                  <Button
                    title="Remove exercise"
                    secondary
                    disabled={d.exercises.length <= 1}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        days: draft.days.map((v, i) =>
                          i === di
                            ? {
                                ...v,
                                exercises: v.exercises.filter(
                                  (_, j) => j !== ei,
                                ),
                              }
                            : v,
                        ),
                      })
                    }
                  />
                </Card>
              ))}
              <Button
                title="Add exercise"
                secondary
                disabled={d.exercises.length >= 10}
                onPress={() =>
                  setDraft({
                    ...draft,
                    days: draft.days.map((v, i) =>
                      i === di
                        ? { ...v, exercises: [...v.exercises, exercise()] }
                        : v,
                    ),
                  })
                }
              />
              <Button
                title="Remove day"
                secondary
                disabled={draft.days.length <= 1}
                onPress={() =>
                  setDraft({
                    ...draft,
                    days: draft.days.filter((_, i) => i !== di),
                  })
                }
              />
            </Card>
          ))}
          <Button
            title="Add training day"
            secondary
            disabled={draft.days.length >= 7}
            onPress={() =>
              setDraft({
                ...draft,
                days: [
                  ...draft.days,
                  {
                    name: `Day ${draft.days.length + 1}`,
                    exercises: [exercise()],
                  },
                ],
              })
            }
          />
          <Button
            title="Save reviewed rotation"
            disabled={task.busy}
            onPress={() =>
              task.run(async () => {
                if (
                  !draft.rationale.trim() ||
                  draft.days.some(
                    (d) =>
                      !d.name.trim() ||
                      d.exercises.some(
                        (e) =>
                          !e.name.trim() ||
                          !Number.isInteger(e.sets) ||
                          e.sets < 1 ||
                          e.sets > 6 ||
                          !Number.isInteger(e.repMin) ||
                          e.repMin < 1 ||
                          e.repMin > 30 ||
                          !Number.isInteger(e.repMax) ||
                          e.repMax < e.repMin ||
                          e.repMax > 30,
                      ),
                  )
                )
                  throw Error(
                    "Complete every exercise and check the set/rep limits before saving.",
                  );
                await api("coach/training", "POST", {
                  action: "apply",
                  plan: draft,
                  baseVersion: base,
                });
                setDraft(null);
                task.setNotice("Future training rotation updated.");
                await refresh();
              })
            }
          />
        </>
      )}
    </Screen>
  );
}
