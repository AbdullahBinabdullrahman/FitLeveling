import { useState, useRef, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
import { FlatList, View, KeyboardAvoidingView, Platform } from "react-native";
import * as Crypto from "expo-crypto";
import { useAuth } from "../../lib/auth";
import { useApi } from "../../lib/query";
import { api } from "../../lib/api";
import {
  Card,
  Heading,
  Body,
  Field,
  Button,
  Status,
  useTask,
  colors,
} from "../../components/ui";
type Message = {
  id: number;
  senderId: string;
  body: string;
  createdAt: string;
};
export default function Chat() {
  const { id, alias } = useLocalSearchParams<{ id: string; alias: string }>(),
    auth = useAuth(),
    q = useApi<{ messages: Message[] }>(
      `messages?friendshipId=${id}`,
      !!id,
      5000,
    ),
    task = useTask(),
    [text, setText] = useState(""),
    [older, setOlder] = useState<Message[]>([]),
    retry = useRef<{ text: string; id: string } | null>(null),
    latest = q.data?.messages.at(-1)?.id;
  useEffect(() => {
    if (latest)
      api("messages", "PATCH", {
        friendshipId: id,
        lastMessageId: latest,
      }).catch(() => {});
  }, [id, latest]);
  const list = useRef<FlatList<Message>>(null);
  useEffect(() => {
    if (latest)
      requestAnimationFrame(() =>
        list.current?.scrollToEnd({ animated: true }),
      );
  }, [latest]);
  const rows = [...older, ...(q.data?.messages ?? [])].filter(
    (m, i, a) => a.findIndex((x) => x.id === m.id) === i,
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={{ padding: 18 }}>
        <Heading>{alias ?? "Your friend"}</Heading>
        <Status loading={q.isPending} error={q.error ?? task.error} />
      </View>
      <FlatList
        ref={list}
        data={rows}
        keyExtractor={(m) => String(m.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 18, gap: 12 }}
        ListHeaderComponent={
          rows.length >= 50 ? (
            <Button
              title="Load older messages"
              secondary
              disabled={task.busy}
              onPress={() =>
                task.run(async () => {
                  const d = await api<{ messages: Message[] }>(
                    `messages?friendshipId=${id}&before=${rows[0].id}`,
                  );
                  setOlder([...d.messages, ...older]);
                })
              }
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf:
                item.senderId === auth.user?.id ? "flex-end" : "stretch",
              maxWidth: "90%",
            }}
          >
            <Card>
              <Body>{item.body}</Body>
              <Body muted>
                {new Date(item.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Body>
            </Card>
          </View>
        )}
      />
      <View style={{ padding: 16, gap: 10 }}>
        <Field
          label="Message"
          value={text}
          multiline
          maxLength={2000}
          onChangeText={setText}
          editable={!task.busy}
        />
        <Button
          title={task.busy ? "Sending…" : "Send"}
          disabled={task.busy || !text.trim()}
          onPress={() =>
            task.run(async () => {
              const body = text.trim(),
                clientId =
                  retry.current?.text === body
                    ? retry.current.id
                    : Crypto.randomUUID();
              retry.current = { text: body, id: clientId };
              await api("messages", "POST", {
                friendshipId: id,
                body,
                clientId,
              });
              setText("");
              retry.current = null;
              await q.refetch();
            })
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}
