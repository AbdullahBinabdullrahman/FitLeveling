import { useEffect, useState } from "react";
import type { CoachComponent } from "../lib/coach-components";
import { Card, Heading, Body, Button } from "./ui";
function Timer({ card }: { card: Extract<CoachComponent, { type: "timer" }> }) {
  const total =
    card.workSeconds * card.rounds + card.restSeconds * (card.rounds - 1);
  const [remaining, setRemaining] = useState(total),
    [end, setEnd] = useState<number | null>(null);
  useEffect(() => {
    if (end == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setRemaining(left);
      if (!left) setEnd(null);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [end]);
  const elapsed = total - remaining,
    cycle = card.workSeconds + card.restSeconds;
  return (
    <Card>
      <Heading>{card.title}</Heading>
      <Body>
        {card.rounds} rounds · {card.workSeconds}s work · {card.restSeconds}s
        rest
      </Body>
      <Body>
        {remaining
          ? `${elapsed % cycle >= card.workSeconds ? "Rest" : "Work"} · Round ${Math.min(card.rounds, Math.floor(elapsed / cycle) + 1)} · ${remaining}s remaining`
          : "Complete"}
      </Body>
      <Button
        title={end ? "Pause" : "Start"}
        disabled={!remaining}
        onPress={() => setEnd(end ? null : Date.now() + remaining * 1000)}
      />
      <Button
        secondary
        title="Reset"
        onPress={() => {
          setEnd(null);
          setRemaining(total);
        }}
      />
      <Body muted>Does not log or verify a workout.</Body>
    </Card>
  );
}
function Checklist({
  card,
}: {
  card: Extract<CoachComponent, { type: "checklist" }>;
}) {
  const [checked, setChecked] = useState<number[]>([]);
  return (
    <Card>
      <Heading>{card.title}</Heading>
      {card.items.map((item, i) => (
        <Button
          secondary
          key={i}
          title={`${checked.includes(i) ? "✓" : "○"} ${item}`}
          onPress={() =>
            setChecked((v) =>
              v.includes(i) ? v.filter((n) => n !== i) : [...v, i],
            )
          }
        />
      ))}
    </Card>
  );
}
export default function CoachComponents({
  cards,
}: {
  cards?: CoachComponent[];
}) {
  return (
    <>
      {cards?.map((card, i) =>
        card.type === "timer" ? (
          <Timer key={i} card={card} />
        ) : card.type === "checklist" ? (
          <Checklist key={i} card={card} />
        ) : (
          <Card key={i}>
            <Heading>{card.title}</Heading>
            {card.steps.map((step, j) => (
              <Body key={j}>
                {j + 1}. {step}
              </Body>
            ))}
            {card.cue && <Body muted>{card.cue}</Body>}
          </Card>
        ),
      )}
    </>
  );
}
