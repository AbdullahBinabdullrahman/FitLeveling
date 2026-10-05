import { useState, useRef } from "react";
import { router } from "expo-router";
import * as Crypto from "expo-crypto";
import { useApi, useRefresh } from "../../lib/query";
import { api } from "../../lib/api";
import type { Friends, GuildData } from "../../lib/types";
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
} from "../../components/ui";
function Guilds() {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState(""),
    [create, setCreate] = useState(false),
    [name, setName] = useState(""),
    [alias, setAlias] = useState(""),
    [description, setDescription] = useState(""),
    [hobbies, setHobbies] = useState(""),
    attempt = useRef<{ signature: string; id: string } | null>(null),
    q = useApi<GuildData>(
      `guilds?q=${encodeURIComponent(search)}${selected ? `&id=${selected}` : ""}`,
    ),
    refresh = useRefresh(),
    task = useTask(),
    g = q.data?.selected;
  function action(body: unknown) {
    task.run(async () => {
      await api("guilds", "POST", body);
      await refresh();
    });
  }
  return (
    <>
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      <Card>
        <Heading>Find your people</Heading>
        <Field label="Search guilds" value={query} onChangeText={setQuery} />
        <Button title="Search" secondary onPress={() => setSearch(query)} />
        <Button
          title={create ? "Close creation form" : "Create a closed guild"}
          onPress={() => setCreate(!create)}
        />
        {create && (
          <>
            {!q.data?.member && (
              <>
                <Field
                  label="Your public nickname"
                  value={alias}
                  maxLength={24}
                  onChangeText={setAlias}
                />
                <Body muted>
                  Your nickname will be visible in the community.
                </Body>
              </>
            )}
            <Field
              label="Guild name"
              value={name}
              maxLength={48}
              onChangeText={setName}
            />
            <Field
              label="What’s your guild about?"
              value={description}
              maxLength={500}
              multiline
              onChangeText={setDescription}
            />
            <Field
              label="Hobbies, separated by commas"
              value={hobbies}
              onChangeText={setHobbies}
            />
            <Button
              title={task.busy ? "Creating…" : "Create guild"}
              disabled={
                task.busy ||
                !q.data ||
                name.trim().length < 2 ||
                (!q.data.member && alias.trim().length < 2)
              }
              onPress={() =>
                task.run(async () => {
                  const draft = {
                      action: "create",
                      name,
                      description,
                      hobbies: hobbies
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                      ...(q.data?.member ? {} : { alias }),
                    },
                    signature = JSON.stringify(draft);
                  if (attempt.current?.signature !== signature)
                    attempt.current = { signature, id: Crypto.randomUUID() };
                  const result = await api<{ guildId: string }>(
                    "guilds",
                    "POST",
                    { ...draft, createId: attempt.current.id },
                  );
                  attempt.current = null;
                  setSelected(result.guildId);
                  setSearch("");
                  setQuery("");
                  setName("");
                  setDescription("");
                  setHobbies("");
                  setCreate(false);
                  task.setNotice("Guild created. You decide who joins.");
                  await refresh();
                })
              }
            />
          </>
        )}
      </Card>
      {!!q.data?.mine.length && (
        <Card>
          <Heading>My guilds & requests</Heading>
          {q.data.mine.map((v) => (
            <Button
              key={v.id}
              title={`${v.name} · ${v.ownerId === q.data!.userId ? "Owner" : (v.status ?? "Member")}`}
              secondary
              disabled={task.busy}
              onPress={() => setSelected(v.id)}
            />
          ))}
        </Card>
      )}
      {g && (
        <Card>
          <Heading>{g.name}</Heading>
          <Body>{g.description}</Body>
          <Body muted>{g.hobbies.join(" · ")}</Body>
          {g.ownerId !== q.data?.userId && (
            <Button
              title={
                g.status === "accepted"
                  ? "Leave guild"
                  : g.status === "pending"
                    ? "Cancel request"
                    : "Request to join"
              }
              disabled={task.busy}
              onPress={() =>
                action({
                  action:
                    g.status === "accepted"
                      ? "leave"
                      : g.status === "pending"
                        ? "cancel"
                        : "apply",
                  id: g.id,
                })
              }
            />
          )}
          <Body muted>
            {g.status === "pending"
              ? "Your request is waiting for approval."
              : ""}
          </Body>
          {g.ownerId === q.data?.userId && (
            <>
              <Heading>Join requests</Heading>
              {!g.members?.some((m) => m.status === "pending") && (
                <Body muted>No pending requests.</Body>
              )}
              {g.members
                ?.filter((m) => m.status === "pending")
                .map((m) => (
                  <Card key={m.userId}>
                    <Body>{m.alias ?? "Explorer"}</Body>
                    <Row>
                      <Button
                        title="Approve"
                        disabled={task.busy}
                        onPress={() =>
                          action({
                            action: "approve",
                            id: g.id,
                            userId: m.userId,
                          })
                        }
                      />
                      <Button
                        title="Reject"
                        secondary
                        disabled={task.busy}
                        onPress={() =>
                          action({
                            action: "reject",
                            id: g.id,
                            userId: m.userId,
                          })
                        }
                      />
                    </Row>
                  </Card>
                ))}
            </>
          )}
          <Heading>Members & interests</Heading>
          {g.members
            ?.filter((m) => m.status === "accepted")
            .map((m) => (
              <Card key={m.userId}>
                <Body>
                  {m.alias ?? "Explorer"}
                  {m.userId === g.ownerId ? " · Owner" : ""}
                </Body>
                <Body muted>{m.hobbies?.join(" · ") || "No hobbies yet"}</Body>
                {g.ownerId === q.data?.userId && m.userId !== g.ownerId && (
                  <Button
                    title="Remove member"
                    secondary
                    disabled={task.busy}
                    onPress={() =>
                      action({ action: "remove", id: g.id, userId: m.userId })
                    }
                  />
                )}
              </Card>
            ))}
        </Card>
      )}
      {q.data?.list.map((v) => (
        <Card key={v.id}>
          <Heading>{v.name}</Heading>
          <Body muted>{v.description}</Body>
          <Body>{v.count} members · Approval required</Body>
          <Button
            title="View guild"
            secondary
            disabled={task.busy}
            onPress={() => setSelected(v.id)}
          />
        </Card>
      ))}
    </>
  );
}
function FriendsPanel({ requests = false }: { requests?: boolean }) {
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    q = useApi<Friends>(`friends?q=${encodeURIComponent(search)}`, true, 10000),
    task = useTask(),
    refresh = useRefresh();
  function action(body: unknown) {
    task.run(async () => {
      await api("friends", "POST", body);
      await refresh();
    });
  }
  return (
    <>
      <Status loading={q.isPending} error={q.error ?? task.error} />
      {!q.data?.joined && (
        <Body muted>
          Join the community in Leaderboard to find people and send requests.
        </Body>
      )}
      {!requests && (
        <Card>
          <Heading>Find a friend</Heading>
          <Field
            label="Nickname or full email"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            maxLength={254}
          />
          <Button
            title="Search"
            secondary
            onPress={() => setSearch(query.trim())}
          />
          {q.data?.people.map((p) => (
            <Card key={p.userId}>
              <Body>{p.alias}</Body>
              <Button
                title="Send friend request"
                disabled={
                  task.busy ||
                  q.data!.connections.some(
                    (f) =>
                      f.userId === p.userId &&
                      ["pending", "accepted"].includes(f.status),
                  )
                }
                onPress={() =>
                  action({ action: "request", toUserId: p.userId })
                }
              />
            </Card>
          ))}
        </Card>
      )}
      {q.data?.connections
        .filter((f) =>
          requests
            ? f.status === "pending"
            : f.status === "accepted" || f.status === "blocked",
        )
        .map((f) => (
          <Card key={f.id}>
            <Heading>{f.alias}</Heading>
            <Body muted>
              {f.status === "pending"
                ? f.incoming
                  ? "Wants to be your friend"
                  : "Request sent"
                : f.unread
                  ? `${f.unread} unread messages`
                  : f.status}
            </Body>
            {f.status === "accepted" ? (
              <Row>
                <Button
                  title="Chat"
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[id]",
                      params: { id: f.id, alias: f.alias },
                    })
                  }
                />
                <Button
                  title="Remove friend"
                  secondary
                  disabled={task.busy}
                  onPress={() =>
                    action({ action: "remove", friendshipId: f.id })
                  }
                />
                <Button
                  title="Block"
                  secondary
                  disabled={task.busy}
                  onPress={() =>
                    action({ action: "block", friendshipId: f.id })
                  }
                />
              </Row>
            ) : f.status === "blocked" ? (
              <Button
                title="Unblock"
                secondary
                disabled={task.busy}
                onPress={() =>
                  action({ action: "unblock", friendshipId: f.id })
                }
              />
            ) : f.incoming ? (
              <Row>
                <Button
                  title="Accept"
                  disabled={task.busy}
                  onPress={() =>
                    action({ action: "accept", friendshipId: f.id })
                  }
                />
                <Button
                  title="Decline"
                  secondary
                  disabled={task.busy}
                  onPress={() =>
                    action({ action: "decline", friendshipId: f.id })
                  }
                />
              </Row>
            ) : (
              <Button
                title="Cancel request"
                secondary
                disabled={task.busy}
                onPress={() => action({ action: "cancel", friendshipId: f.id })}
              />
            )}
          </Card>
        ))}
    </>
  );
}
function Leaderboard() {
  const q = useApi<{
      member: { alias: string } | null;
      leaderboard: {
        userId: string;
        alias: string;
        rank: number;
        score: number;
        cheered: boolean;
      }[];
    }>("community"),
    refresh = useRefresh(),
    task = useTask(),
    [alias, setAlias] = useState("");
  return (
    <>
      <Status loading={q.isPending} error={q.error ?? task.error} />
      <Card>
        <Heading>
          {q.data?.member ? "Your community nickname" : "Join the community"}
        </Heading>
        <Body muted>
          A public nickname lets others find you. No email is displayed.
        </Body>
        <Field
          label="Nickname"
          value={alias}
          placeholder={q.data?.member?.alias}
          maxLength={24}
          onChangeText={setAlias}
        />
        <Button
          title="Save nickname"
          disabled={task.busy || alias.trim().length < 2}
          onPress={() =>
            task.run(async () => {
              await api("community", "POST", { action: "join", alias });
              await refresh();
            })
          }
        />
      </Card>
      {q.data?.leaderboard.map((m) => (
        <Card key={m.userId}>
          <Heading>
            #{m.rank} {m.alias}
          </Heading>
          <Body>{m.score} weekly points</Body>
          <Button
            title={m.cheered ? "Cheered" : "Send encouragement"}
            secondary
            disabled={task.busy || m.cheered}
            onPress={() =>
              task.run(async () => {
                await api("community", "POST", {
                  action: "cheer",
                  toUserId: m.userId,
                });
                await refresh();
              })
            }
          />
        </Card>
      ))}
    </>
  );
}
export default function Community() {
  const [tab, setTab] = useState("guilds");
  return (
    <Screen
      title="Find your people"
      subtitle="Grow together, at your own pace."
    >
      <Row>
        {[
          ["guilds", "Guilds"],
          ["friends", "Friends"],
          ["requests", "Requests"],
          ["leaderboard", "Leaderboard"],
        ].map(([key, label]) => (
          <Button
            key={key}
            title={label}
            secondary={tab !== key}
            onPress={() => setTab(key)}
          />
        ))}
      </Row>
      {tab === "guilds" ? (
        <Guilds />
      ) : tab === "leaderboard" ? (
        <Leaderboard />
      ) : (
        <FriendsPanel key={tab} requests={tab === "requests"} />
      )}
    </Screen>
  );
}
