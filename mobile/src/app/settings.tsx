import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Switch, Linking, Platform } from "react-native";
import { useAuth } from "../lib/auth";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
import { storage } from "../lib/storage";
import {
  registerPush,
  unregisterPush,
  setReminder,
} from "../lib/notifications";
import {
  Screen,
  Card,
  Heading,
  Body,
  Field,
  Button,
  Row,
  Status,
  useTask,
  colors,
} from "../components/ui";
type Account = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  hasPassword: boolean;
};
type CoachSettings = {
  provider: string;
  model: string;
  hasPersonalKey: boolean;
};
export default function Settings() {
  const auth = useAuth(),
    q = useApi<{ user: Account }>("account"),
    c = useApi<CoachSettings>("coach/settings"),
    refresh = useRefresh(),
    task = useTask(),
    [form, setForm] = useState<Account>(),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [reminder, setDaily] = useState(false),
    [push, setPush] = useState(false),
    [hour, setHour] = useState("18"),
    [minute, setMinute] = useState("00"),
    [haptics, setHaptics] = useState(true),
    [provider, setProvider] = useState("builtin"),
    [model, setModel] = useState(""),
    [key, setKey] = useState(""),
    [coachInitialized, setCoachInitialized] = useState(false);
  if (q.data && !form) setForm(q.data.user);
  if (c.data && !coachInitialized) {
    setProvider(c.data.provider);
    setModel(c.data.model);
    setCoachInitialized(true);
  }
  useEffect(() => {
    storage
      .getItem("fit-preferences")
      .then((v) => {
        if (v) {
          const p = JSON.parse(v);
          setDaily(p.reminder ?? false);
          setPush(p.push ?? false);
          setHour(p.hour ?? "18");
          setMinute(p.minute ?? "00");
          setHaptics(p.haptics ?? true);
        }
      })
      .catch(() => {});
  }, []);
  async function prefs(next: {
    reminder: boolean;
    push: boolean;
    haptics: boolean;
  }) {
    await storage.setItem(
      "fit-preferences",
      JSON.stringify({ ...next, hour, minute }),
    );
    await storage.setItem("fit-haptics", String(next.haptics));
  }
  return (
    <Screen
      title="Make it yours"
      subtitle="Your account, your preferences."
      refresh={() => refresh()}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      {form && (
        <Card>
          <Heading>Your account</Heading>
          <Field
            label="Name"
            value={form.name}
            maxLength={80}
            onChangeText={(v) => setForm({ ...form, name: v })}
          />
          <Field
            label={
              form.hasPassword
                ? "Email"
                : "Email · managed by your sign-in provider"
            }
            value={form.email}
            editable={form.hasPassword}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(v) => setForm({ ...form, email: v })}
          />
          <Field
            label="Timezone"
            value={form.timezone ?? "Asia/Riyadh"}
            onChangeText={(v) => setForm({ ...form, timezone: v })}
          />
          {form.hasPassword && (
            <>
              <Field
                label="Current password · needed for email/password changes"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <Field
                label="New password · optional"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </>
          )}
          <Button
            title={task.busy ? "Saving…" : "Save account"}
            disabled={task.busy}
            onPress={() =>
              task.run(async () => {
                const result = await api<{ user: Account }>(
                  "account",
                  "PATCH",
                  {
                    name: form.name,
                    email: form.email,
                    timezone: form.timezone,
                    ...(password ? { currentPassword: password } : {}),
                    ...(newPassword ? { newPassword } : {}),
                  },
                );
                auth.updateUser(result.user);
                setPassword("");
                setNewPassword("");
                task.setNotice("Account saved.");
                await refresh();
              })
            }
          />
        </Card>
      )}
      <Card>
        <Heading>Notifications & feel</Heading>
        <Body muted>
          Optional reminders use your phone’s local time. Social notifications
          need a device build with push credentials.
        </Body>
        <Row>
          <Body>Daily reminder</Body>
          <Switch
            value={reminder}
            disabled={task.busy}
            trackColor={{ true: colors.mint }}
            onValueChange={(value) =>
              task.run(async () => {
                const h = Number(hour),
                  m = Number(minute);
                if (
                  !Number.isInteger(h) ||
                  h < 0 ||
                  h > 23 ||
                  !Number.isInteger(m) ||
                  m < 0 ||
                  m > 59
                )
                  throw Error("Choose an hour 0–23 and minute 0–59");
                await setReminder(value, h, m);
                setDaily(value);
                await prefs({ reminder: value, push, haptics });
              })
            }
          />
        </Row>
        <Field
          label="Reminder hour · 0–23"
          keyboardType="number-pad"
          maxLength={2}
          value={hour}
          onChangeText={setHour}
        />
        <Field
          label="Minute · 0–59"
          keyboardType="number-pad"
          maxLength={2}
          value={minute}
          onChangeText={setMinute}
        />
        {reminder && (
          <Button
            title="Update reminder time"
            secondary
            disabled={task.busy}
            onPress={() =>
              task.run(async () => {
                const h = Number(hour),
                  m = Number(minute);
                if (
                  !Number.isInteger(h) ||
                  h < 0 ||
                  h > 23 ||
                  !Number.isInteger(m) ||
                  m < 0 ||
                  m > 59
                )
                  throw Error("Choose a valid time");
                await setReminder(true, h, m);
                await prefs({ reminder, push, haptics });
              })
            }
          />
        )}
        <Row>
          <Body>Friend, chat & guild notifications</Body>
          <Switch
            value={push}
            disabled={task.busy}
            trackColor={{ true: colors.mint }}
            onValueChange={(value) =>
              task.run(async () => {
                if (value) await registerPush();
                else await unregisterPush();
                setPush(value);
                await prefs({ reminder, push: value, haptics });
              })
            }
          />
        </Row>
        <Row>
          <Body>Gentle haptic feedback</Body>
          <Switch
            value={haptics}
            trackColor={{ true: colors.mint }}
            onValueChange={(value) =>
              task.run(async () => {
                setHaptics(value);
                await prefs({ reminder, push, haptics: value });
              })
            }
          />
        </Row>
        {Platform.OS !== "web" && (
          <Button
            title="Open phone settings"
            secondary
            onPress={() => Linking.openSettings()}
          />
        )}
      </Card>
      <Card>
        <Heading>Your AI coach</Heading>
        <Body muted>
          The selected provider receives chat and fitness context. Personal API
          usage is billed to your key.
        </Body>
        <Row>
          {["builtin", "openai", "groq"].map((v) => (
            <Button
              key={v}
              title={v}
              secondary={provider !== v}
              onPress={() => setProvider(v)}
            />
          ))}
        </Row>
        {provider !== "builtin" && (
          <>
            <Field label="Model ID" value={model} onChangeText={setModel} />
            <Field
              label={
                c.data?.hasPersonalKey
                  ? "API key · leave blank to keep saved key"
                  : "API key"
              }
              secureTextEntry
              autoCapitalize="none"
              value={key}
              onChangeText={setKey}
            />
          </>
        )}
        <Button
          title="Save coach connection"
          disabled={task.busy}
          onPress={() =>
            task.run(async () => {
              await api("coach/settings", "PATCH", {
                provider,
                model: provider === "builtin" ? "" : model,
                ...(key.trim() ? { apiKey: key.trim() } : {}),
              });
              setKey("");
              task.setNotice("Coach connection saved.");
              await refresh();
            })
          }
        />
      </Card>
      <Button
        title="Fitness profile & InBody"
        onPress={() => router.push("/fitness-profile")}
      />
      <Button
        title="Sign out"
        secondary
        disabled={task.busy}
        onPress={() => task.run(() => auth.logout())}
      />
    </Screen>
  );
}
