import { useState } from "react";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import {
  Screen,
  Card,
  Heading,
  Body,
  Field,
  Row,
  Button,
  Status,
  useTask,
} from "../components/ui";
type Profile = {
  heightCm: string | null;
  currentWeightKg: string | null;
  birthYear: number | null;
  sexForEstimate: "male" | "female" | null;
  activityFactor: string;
  goal: "lose" | "maintain" | "gain";
};
function ProfileForm({ profile }: { profile: Profile }) {
  const task = useTask(),
    refresh = useRefresh(),
    [height, setHeight] = useState(profile.heightCm ?? ""),
    [weight, setWeight] = useState(profile.currentWeightKg ?? ""),
    [year, setYear] = useState(String(profile.birthYear ?? "")),
    [sex, setSex] = useState(profile.sexForEstimate ?? "male"),
    [activity, setActivity] = useState(profile.activityFactor ?? "1.4"),
    [goal, setGoal] = useState(profile.goal ?? "maintain");
  return (
    <Card>
      <Heading>Your fitness profile</Heading>
      <Status error={task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      <Field
        label="Height · cm"
        keyboardType="decimal-pad"
        value={height}
        onChangeText={setHeight}
      />
      <Field
        label="Current weight · kg"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
      />
      <Field
        label="Birth year"
        keyboardType="number-pad"
        value={year}
        onChangeText={setYear}
      />
      <Body muted>Sex used for calorie estimates</Body>
      <Row>
        {(["male", "female"] as const).map((v) => (
          <Button
            key={v}
            title={v}
            secondary={sex !== v}
            onPress={() => setSex(v)}
          />
        ))}
      </Row>
      <Field
        label="Activity factor · 1.2–1.9"
        keyboardType="decimal-pad"
        value={activity}
        onChangeText={setActivity}
      />
      <Row>
        {(["lose", "maintain", "gain"] as const).map((v) => (
          <Button
            key={v}
            title={v}
            secondary={goal !== v}
            onPress={() => setGoal(v)}
          />
        ))}
      </Row>
      <Body muted>
        Saving keeps your current nutrition targets. Ask the coach to review and
        propose changes.
      </Body>
      <Button
        title="Save profile"
        disabled={task.busy}
        onPress={() =>
          task.run(async () => {
            await api("profile", "PATCH", {
              heightCm: Number(height),
              currentWeightKg: Number(weight),
              birthYear: Number(year),
              sexForEstimate: sex,
              activityFactor: Number(activity),
              goal,
              applyTargets: false,
            });
            task.setNotice("Profile saved.");
            await refresh();
          })
        }
      />
    </Card>
  );
}
export default function FitnessProfile() {
  const q = useApi<{ profile: Profile }>("profile"),
    refresh = useRefresh(),
    task = useTask(),
    [date, setDate] = useState(new Date().toLocaleDateString("en-CA")),
    [weight, setWeight] = useState(""),
    [fat, setFat] = useState(""),
    [muscle, setMuscle] = useState("");
  return (
    <Screen title="Fitness & InBody" refresh={() => q.refetch()}>
      <Status loading={q.isPending} error={q.error} />
      {q.data?.profile && <ProfileForm profile={q.data.profile} />}
      <Card>
        <Heading>New InBody measurement</Heading>
        <Status error={task.error} />
        {task.notice && <Body>{task.notice}</Body>}
        <Field label="Date · YYYY-MM-DD" value={date} onChangeText={setDate} />
        <Field
          label="Weight · kg"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <Field
          label="Body fat · % · optional"
          keyboardType="decimal-pad"
          value={fat}
          onChangeText={setFat}
        />
        <Field
          label="Skeletal muscle · kg · optional"
          keyboardType="decimal-pad"
          value={muscle}
          onChangeText={setMuscle}
        />
        <Button
          title="Save measurement"
          disabled={task.busy || !weight.trim()}
          onPress={() =>
            task.run(async () => {
              await api("inbody", "POST", {
                measuredAt: date,
                weightKg: Number(weight),
                ...(fat ? { bodyFatPercent: Number(fat) } : {}),
                ...(muscle ? { skeletalMuscleKg: Number(muscle) } : {}),
              });
              setWeight("");
              setFat("");
              setMuscle("");
              task.setNotice("Saved. Ask your coach to review it.");
              await refresh();
            })
          }
        />
      </Card>
    </Screen>
  );
}
