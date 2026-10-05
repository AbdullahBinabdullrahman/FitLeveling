import { useRef, useState, useEffect } from "react";
import { router } from "expo-router";
import {
  FlatList,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import * as Crypto from "expo-crypto";
import { useApi, useRefresh } from "../../lib/query";
import { api } from "../../lib/api";
import type { CoachMessage } from "../../lib/types";
import {
  Card,
  Heading,
  Body,
  Button,
  Status,
  useTask,
  colors,
} from "../../components/ui";
import Proposal from "../../components/Proposal";
export default function Coach() {
  const q = useApi<{ messages: CoachMessage[] }>("coach"),
    refresh = useRefresh(),
    task = useTask(),
    [input, setInput] = useState(""),
    retry = useRef<{ text: string; id: string } | null>(null),
    list = useRef<FlatList<CoachMessage>>(null);
  function send(text: string) {
    const message = text.trim();
    if (!message || task.busy) return;
    task.run(async () => {
      const clientId =
        retry.current?.text === message
          ? retry.current.id
          : Crypto.randomUUID();
      retry.current = { text: message, id: clientId };
      await api("coach", "POST", { message, clientId });
      retry.current = null;
      setInput("");
      await q.refetch();
      list.current?.scrollToEnd({ animated: true });
    });
  }
  const latest = q.data?.messages.at(-1)?.id;
  useEffect(() => {
    if (latest)
      requestAnimationFrame(() =>
        list.current?.scrollToEnd({ animated: true }),
      );
  }, [latest]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={{ padding: 18, gap: 10 }}>
        <Heading>Let’s talk it through.</Heading>
        <Body muted>
          Training, nutrition, or a new routine — you choose what changes.
        </Body>
        <Status error={q.error ?? task.error} loading={q.isPending} />
        <Button
          title="Coach connection settings"
          secondary
          onPress={() => router.push("/settings")}
        />
      </View>
      <FlatList
        ref={list}
        data={q.data?.messages ?? []}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 18, gap: 12, flexGrow: 1 }}
        ListEmptyComponent={
          <Card>
            <Heading>What’s on your mind?</Heading>
            <Body muted>
              Tell me what you want to try, or what’s getting in the way.
            </Body>
            {[
              "Can we adjust my exercises?",
              "Let’s review my nutrition targets",
              "Help me build a daily habit",
            ].map((prompt) => (
              <Button
                key={prompt}
                title={prompt}
                secondary
                disabled={task.busy}
                onPress={() => send(prompt)}
              />
            ))}
          </Card>
        }
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.role === "user" ? "flex-end" : "stretch",
              maxWidth: item.role === "user" ? "88%" : "100%",
            }}
          >
            <Card>
              <Text
                style={{
                  color: item.role === "user" ? colors.mint : colors.violet,
                  fontWeight: "700",
                }}
              >
                {item.role === "user" ? "You" : "Coach"}
              </Text>
              <Body>{item.content}</Body>
              {item.proposal && (
                <Proposal
                  data={item.proposal}
                  status={item.status}
                  busy={task.busy}
                  onAction={(action) =>
                    task.run(async () => {
                      await api("coach/actions", "POST", {
                        id: item.id,
                        action,
                      });
                      await refresh();
                    })
                  }
                />
              )}
            </Card>
          </View>
        )}
      />
      <View
        style={{
          padding: 16,
          paddingTop: 10,
          borderTopWidth: 1,
          borderColor: colors.line,
          gap: 10,
        }}
      >
        {task.busy && <Body muted>Working on it…</Body>}
        <TextInput
          accessibilityLabel="Message your coach"
          placeholder="Tell me what you’d like to work on…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1500}
          editable={!task.busy}
          value={input}
          onChangeText={setInput}
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.card,
            color: colors.text,
            minHeight: 52,
            maxHeight: 130,
            fontSize: 16,
          }}
        />
        <Button
          title={task.busy ? "Thinking…" : "Send message"}
          disabled={task.busy || !input.trim()}
          onPress={() => send(input)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
