import type { Proposal as Data } from "../lib/types";
import { View } from "react-native";
import { Heading, Body, Button, Row } from "./ui";
export default function Proposal({
  data,
  status,
  busy,
  onAction,
}: {
  data: Data;
  status: string;
  busy: boolean;
  onAction: (action: "apply" | "dismiss") => void;
}) {
  return (
    <View
      style={{
        padding: 16,
        gap: 10,
        backgroundColor: "#103136",
        borderRadius: 16,
      }}
    >
      <Heading>
        {status === "applied"
          ? "Saved"
          : status === "dismissed"
            ? "Kept current"
            : "Review this change"}
      </Heading>
      {data.type === "training" ? (
        <>
          <Body>{data.plan.rationale}</Body>
          {data.plan.days.map((d, i) => (
            <View key={i}>
              <Heading>{d.name}</Heading>
              {d.exercises.map((e, j) => (
                <Body key={j}>
                  {e.name} · {e.sets} × {e.repMin}–{e.repMax}
                </Body>
              ))}
            </View>
          ))}
          <Body muted>
            Replaces future days; an active workout stays as it is.
          </Body>
        </>
      ) : (
        <Body>
          {data.type === "targets"
            ? `${data.calories} kcal · ${data.proteinMin}–${data.proteinMax}g protein/day`
            : data.type === "nutrition"
              ? `${data.day}: ${data.calories} kcal · ${data.proteinG}g protein (replaces daily total)`
              : data.type === "goal"
                ? `Goal: ${data.goal}`
                : data.type === "weight"
                  ? `Current weight: ${data.weightKg} kg`
                  : data.type === "habit"
                    ? `Daily habit: ${data.name}`
                    : `Hobbies: ${data.tags.join(", ")}`}
        </Body>
      )}
      {status === "pending" && (
        <Row>
          <Button
            title="Apply change"
            disabled={busy}
            onPress={() => onAction("apply")}
          />
          <Button
            title="Keep current"
            secondary
            disabled={busy}
            onPress={() => onAction("dismiss")}
          />
        </Row>
      )}
    </View>
  );
}
