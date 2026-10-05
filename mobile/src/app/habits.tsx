import { useState } from "react";
import { useApi, useRefresh } from "../lib/query";
import { api } from "../lib/api";
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
} from "../components/ui";
type Data = {
  day: string;
  hobbies: string[];
  habits: { id: string; name: string; done: boolean; count: number }[];
};
export default function Habits() {
  const q = useApi<Data>("habits"),
    refresh = useRefresh(),
    task = useTask(),
    [name, setName] = useState(""),
    [tags, setTags] = useState(""),
    [initialized, setInitialized] = useState(false);
  if (q.data && !initialized) {
    setTags(q.data.hobbies.join(", "));
    setInitialized(true);
  }
  return (
    <Screen
      title="Small steps, every day"
      subtitle={q.data?.day}
      refresh={() => q.refetch()}
      refreshing={q.isRefetching}
    >
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {q.data?.habits.map((h) => (
        <Card key={h.id}>
          <Heading>{h.name}</Heading>
          <Body muted>{h.count}/7 days this week</Body>
          <Row>
            <Button
              title={h.done ? "Done · Undo" : "Mark done"}
              disabled={task.busy}
              onPress={() =>
                task.run(async () => {
                  await api("habits", "POST", {
                    action: h.done ? "uncheck" : "check",
                    id: h.id,
                  });
                  await refresh();
                })
              }
            />
            <Button
              title="Archive"
              secondary
              disabled={task.busy}
              onPress={() =>
                task.run(async () => {
                  await api("habits", "POST", { action: "archive", id: h.id });
                  await refresh();
                })
              }
            />
          </Row>
        </Card>
      ))}
      <Card>
        <Heading>A new habit</Heading>
        <Field
          label="Something small you can repeat"
          value={name}
          onChangeText={setName}
          maxLength={80}
          placeholder="Read for 10 minutes"
        />
        <Button
          title="Add habit"
          disabled={task.busy || !name.trim()}
          onPress={() =>
            task.run(async () => {
              await api("habits", "POST", { action: "create", name });
              setName("");
              await refresh();
            })
          }
        />
      </Card>
      <Card>
        <Heading>Your hobbies</Heading>
        <Body muted>
          Shared with members of guilds you join. Up to 12 interests.
        </Body>
        <Field
          label="Hobbies, separated by commas"
          value={tags}
          onChangeText={setTags}
        />
        <Button
          title="Save hobbies"
          disabled={task.busy}
          onPress={() =>
            task.run(async () => {
              await api("habits", "POST", {
                action: "hobbies",
                tags: tags
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              });
              await refresh();
            })
          }
        />
      </Card>
      <Card>
        <Heading>A little encouragement</Heading>
        <Body>
          Attach a habit to something you already do. Make the first step small.
          If you miss a day, tomorrow is a fresh start.
        </Body>
      </Card>
    </Screen>
  );
}
