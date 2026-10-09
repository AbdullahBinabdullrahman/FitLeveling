import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from "react-native-svg";
import { useApi, useRefresh } from "../../lib/query";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Game, Quest } from "../../lib/types";
import Hero from "../../components/Hero";
import {
  Screen,
  ProgressMeter,
  Card,
  Heading,
  Body,
  Button,
  Row,
  Status,
  useTask,
  colors,
} from "../../components/ui";
function evolution(total: number) {
  let level = 1,
    remainder = total;
  while (remainder >= Math.round(100 * level ** 1.35)) {
    remainder -= Math.round(100 * level ** 1.35);
    level++;
  }
  return { level, remainder, needed: Math.round(100 * level ** 1.35) };
}
function QuestCard({
  quest,
  busy,
  claim,
}: {
  quest: Quest;
  busy: boolean;
  claim: () => void;
}) {
  return (
    <Card>
      <Row>
        <Ionicons name="sparkles-outline" size={19} color={colors.violet} />
        <Text style={s.eyebrow}>{quest.kind.toUpperCase()} QUEST</Text>
      </Row>
      <Heading>{quest.title}</Heading>
      <Body muted>{quest.description}</Body>
      <ProgressMeter
        value={(quest.current / quest.target) * 100}
        color={colors.violet}
      />
      <Row>
        <Text style={s.reward}>⚡ {quest.xp} XP</Text>
        <Text style={[s.reward, { color: "#FFCB75" }]}>
          ◈ {quest.coins} coins
        </Text>
        <Body muted>
          {Math.min(quest.current, quest.target)}/{quest.target}
        </Body>
      </Row>
      <Button
        title={
          quest.claimed
            ? "Reward collected"
            : quest.current >= quest.target
              ? "Collect reward"
              : "Continue your mission"
        }
        disabled={busy || quest.claimed}
        secondary={quest.current < quest.target}
        onPress={
          quest.current >= quest.target
            ? claim
            : () => router.push("/(tabs)/train")
        }
      />
    </Card>
  );
}
export default function Home() {
  const { user } = useAuth(),
    q = useApi<Game>("game"),
    refresh = useRefresh(),
    task = useTask(),
    g = q.data,
    { width } = useWindowDimensions(),
    wide = width >= 900;
  if (!g)
    return (
      <Screen title="Your adventure">
        <Status loading={q.isPending} error={q.error} />
      </Screen>
    );
  const xp = evolution(g.stats.lifetimeXp),
    percent = xp.remainder / xp.needed,
    boss = g.quests.find((v) => v.id === "weekly-boss"),
    nextQuest =
      g.quests.find(
        (v) => v.id !== "weekly-boss" && !v.claimed && v.current >= v.target,
      ) ?? g.quests.find((v) => v.id !== "weekly-boss"),
    activeDays = g.days.filter((d) => d.trained).length;
  const claim = (quest: Quest) =>
    task.run(async () => {
      await api("game", "POST", { questId: quest.id });
      task.setNotice(`+${quest.xp} XP · +${quest.coins} coins. Keep growing!`);
      await refresh();
    });
  return (
    <Screen
      title="Your next chapter starts here."
      subtitle={`Welcome back, ${user?.name.split(" ")[0] ?? "explorer"} · ${activeDays} active days this week`}
      refresh={() => refresh()}
      refreshing={q.isRefetching}
    >
      <Status error={q.error ?? task.error} />
      {task.notice && <Body>{task.notice}</Body>}
      <View style={[s.layout, wide && s.horizontal]}>
        <View style={[s.adventure, { flex: wide ? 3 : undefined }]}>
          <Svg
            width="100%"
            height="100%"
            style={StyleSheet.absoluteFill}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient id="adventure" x1="0" y1="0" x2="1" y2="1">
                <Stop stopColor="#302744" />
                <Stop offset=".6" stopColor="#172439" />
                <Stop offset="1" stopColor="#183B3E" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#adventure)" />
            {Array.from({ length: 24 }, (_, i) => (
              <Circle
                key={i}
                cx={`${(i * 37) % 100}%`}
                cy={`${(i * 23) % 100}%`}
                r={i % 3 ? 1 : 2}
                fill="#C9BAFF"
                opacity=".3"
              />
            ))}
          </Svg>
          <View style={[s.heroContent, wide && s.horizontal]}>
            <View style={{ flex: 1, gap: 18 }}>
              <Text style={s.chapter}>
                ● CHAPTER {Math.floor((g.stats.level - 1) / 5) + 1} · THE
                AWAKENING
              </Text>
              <Text style={s.headline}>
                Small steps.{"\n"}
                <Text style={{ color: "#C9B3FA" }}>Legendary you.</Text>
              </Text>
              <Body muted>
                Your real-world effort powers {g.character.name}’s journey.
                Train, explore, and become stronger together.
              </Body>
              <Button
                title={
                  g.stats.todayWorkouts
                    ? "Open training →"
                    : "Start a mission →"
                }
                onPress={() => router.push("/(tabs)/train")}
              />
              <Button
                title="Customize hero"
                secondary
                onPress={() => router.push("/hero")}
              />
              <Text style={s.eyebrow}>
                RANK {g.stats.level >= 10 ? "C" : "D"} · ⚡{" "}
                {g.stats.lifetimeXp.toLocaleString()} LIFETIME XP
              </Text>
            </View>
            <View style={s.stage}>
              <Hero
                character={g.character}
                size={wide ? 240 : 250}
                level={g.stats.level}
              />
              <View style={s.nameplate}>
                <Text style={{ color: colors.mint }}>●</Text>
                <Text style={s.heroName}>{g.character.name}</Text>
                <Text style={s.levelTag}>LV {g.stats.level}</Text>
              </View>
              <Text style={s.tapHint}>Tap your companion to power up</Text>
            </View>
          </View>
        </View>
        <View style={[s.evolution, { flex: wide ? 1 : undefined }]}>
          <Text style={s.eyebrow}>✦ YOUR EVOLUTION</Text>
          <View style={{ alignItems: "center" }}>
            <Svg width={170} height={170} viewBox="0 0 170 170">
              <Circle
                cx={85}
                cy={85}
                r={68}
                stroke="#28344E"
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={85}
                cy={85}
                r={68}
                stroke={colors.violet}
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 68}`}
                strokeDashoffset={2 * Math.PI * 68 * (1 - percent)}
                transform="rotate(-90 85 85)"
              />
            </Svg>
            <View style={s.ringLabel}>
              <Text style={s.eyebrow}>LEVEL</Text>
              <Text style={s.levelNumber}>{g.stats.level}</Text>
            </View>
          </View>
          <Body>
            {xp.remainder} / {xp.needed} XP
          </Body>
          <Body muted>{xp.needed - xp.remainder} XP to your next level</Body>
          <View style={s.unlock}>
            <Ionicons name="sparkles" size={22} color={colors.violet} />
            <View>
              <Text style={s.eyebrow}>NEXT UNLOCK</Text>
              <Text style={s.heroName}>
                {g.stats.level >= 10
                  ? "All hero gear unlocked"
                  : "New companion gear"}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={s.stats}>
        {[
          {
            icon: "barbell-outline",
            value: g.stats.weeklyWorkouts,
            label: "Missions this week",
            color: colors.mint,
          },
          {
            icon: "diamond-outline",
            value: g.stats.coins.toLocaleString(),
            label: "Coins to enjoy",
            color: "#FFCB75",
          },
          {
            icon: "flame-outline",
            value: `${Math.min(activeDays, 3)} / 3`,
            label: "Boss shields cleared",
            color: colors.violet,
          },
        ].map((v, i) => (
          <Pressable
            key={v.label}
            onPress={() => router.push(i === 1 ? "/shop" : "/(tabs)/train")}
            style={s.stat}
          >
            <View style={[s.statIcon, { backgroundColor: v.color + "18" }]}>
              <Ionicons
                name={v.icon as "flame-outline"}
                size={23}
                color={v.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.statNumber}>{v.value}</Text>
              <Text style={s.small}>{v.label}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      <View style={[s.layout, wide && s.horizontal]}>
        <View style={{ flex: 1 }}>
          <View style={s.raid}>
            <Row>
              <Ionicons name="shield-outline" size={24} color={colors.violet} />
              <Text style={s.eyebrow}>WEEKLY BOSS RAID</Text>
              <Text style={s.chapter}>CO-OP WITH YOURSELF</Text>
            </Row>
            <Heading>{boss?.title ?? "The Consistency Guardian"}</Heading>
            <Body muted>
              Three training days. Three shields. Your effort breaks them one at
              a time.
            </Body>
            <Row>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    s.shield,
                    { borderColor: i < activeDays ? colors.mint : colors.line },
                  ]}
                >
                  <Ionicons
                    name={
                      i < activeDays ? "checkmark-circle" : "shield-outline"
                    }
                    size={32}
                    color={i < activeDays ? colors.mint : colors.muted}
                  />
                  <Text style={s.small}>DAY {i + 1}</Text>
                </View>
              ))}
            </Row>
            <ProgressMeter value={(Math.min(activeDays, 3) / 3) * 100} />
            <Body>
              ⚡ {boss?.xp ?? 250} XP · ◈ {boss?.coins ?? 75} coins
            </Body>
            <Button
              title={
                boss?.claimed
                  ? "Guardian defeated"
                  : boss && boss.current >= boss.target
                    ? "Collect raid rewards"
                    : "Break the next shield →"
              }
              disabled={task.busy || boss?.claimed}
              onPress={() =>
                boss && boss.current >= boss.target
                  ? claim(boss)
                  : router.push("/(tabs)/train")
              }
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          {nextQuest && (
            <QuestCard
              quest={nextQuest}
              busy={task.busy}
              claim={() => claim(nextQuest)}
            />
          )}
        </View>
      </View>
      <View style={[s.layout, wide && s.horizontal]}>
        <View style={{ flex: 1 }}>
          <Card>
            <Row>
              <Heading>Your weekly rhythm</Heading>
              <Button
                title="Quest log →"
                secondary
                onPress={() => router.push("/quests")}
              />
            </Row>
            <View style={s.week}>
              {g.days.map((d) => (
                <View
                  key={d.day}
                  style={[
                    s.day,
                    d.trained && {
                      backgroundColor: "#173C39",
                      borderColor: colors.mint,
                    },
                  ]}
                >
                  <Text style={s.small}>
                    {new Date(d.day + "T12:00:00").toLocaleDateString("en", {
                      weekday: "short",
                    })}
                  </Text>
                  <Ionicons
                    name={d.trained ? "checkmark" : "remove"}
                    size={23}
                    color={d.trained ? colors.mint : colors.muted}
                  />
                  <Text style={{ color: d.fueled ? "#FFCB75" : colors.line }}>
                    ●
                  </Text>
                </View>
              ))}
            </View>
            <Body muted>
              ✓ Training · gold dot = fuel check-in. Recovery is part of the
              journey.
            </Body>
            <Button
              title="See your progress →"
              secondary
              onPress={() => router.push("/progress")}
            />
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Heading>Today’s quests</Heading>
          {g.quests
            .filter((q) => q.kind === "daily")
            .map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                busy={task.busy}
                claim={() => claim(q)}
              />
            ))}
          <Card>
            <Text style={s.eyebrow}>NEED A SPARK?</Text>
            <Heading>Your companion has your back.</Heading>
            <Body muted>
              Talk it through with your coach, find your people, or choose
              something new for your hero.
            </Body>
            <Button
              title="✦ Talk to your coach"
              onPress={() => router.push("/(tabs)/coach")}
            />
            <Row>
              <Button
                title="Community"
                secondary
                onPress={() => router.push("/(tabs)/community")}
              />
              <Button
                title="Equipment"
                secondary
                onPress={() => router.push("/shop")}
              />
              <Button
                title="Habits"
                secondary
                onPress={() => router.push("/habits")}
              />
            </Row>
          </Card>
        </View>
      </View>
    </Screen>
  );
}
const s = StyleSheet.create({
  layout: { gap: 18 },
  horizontal: { flexDirection: "row", alignItems: "stretch" },
  adventure: {
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#424260",
  },
  heroContent: { padding: 26, gap: 20, alignItems: "stretch" },
  chapter: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.mint,
  },
  headline: {
    fontSize: 39,
    fontWeight: "900",
    lineHeight: 45,
    color: colors.text,
    letterSpacing: -1.4,
  },
  stage: { alignItems: "center", gap: 10 },
  nameplate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    backgroundColor: "#0D182BDD",
    borderColor: "#3C4864",
    borderWidth: 1,
  },
  heroName: { fontSize: 14, fontWeight: "700", color: colors.text },
  levelTag: { fontSize: 11, fontWeight: "800", color: colors.violet },
  tapHint: { fontSize: 11, color: colors.muted },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.violet,
    letterSpacing: 1.2,
  },
  evolution: {
    borderRadius: 24,
    padding: 22,
    gap: 14,
    backgroundColor: "#181F32",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabel: { position: "absolute", top: 53, alignItems: "center" },
  levelNumber: { fontSize: 45, fontWeight: "900", color: colors.text },
  unlock: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 14,
    backgroundColor: "#252638",
    borderRadius: 16,
  },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    backgroundColor: "#171E30",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    flexGrow: 1,
    flexBasis: 240,
  },
  statIcon: { padding: 12, borderRadius: 14 },
  statNumber: { fontSize: 24, fontWeight: "800", color: colors.text },
  small: { fontSize: 10, color: colors.muted, lineHeight: 18 },
  track: {
    height: 6,
    backgroundColor: "#28344E",
    borderRadius: 8,
    overflow: "hidden",
  },
  reward: { fontSize: 13, fontWeight: "700", color: colors.mint },
  raid: {
    backgroundColor: "#1C2035",
    padding: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#494063",
    gap: 16,
  },
  shield: {
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flex: 1,
    backgroundColor: "#111A2A",
  },
  week: { flexDirection: "row", gap: 5 },
  day: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 10,
    gap: 5,
  },
});
