"use client";
import { useEffect, useState } from "react";
import type { CoachComponent } from "@/lib/coach-components";
function Timer({ card }: { card: Extract<CoachComponent, { type: "timer" }> }) {
  const total =
    card.rounds * card.workSeconds + (card.rounds - 1) * card.restSeconds;
  const [remaining, setRemaining] = useState(total);
  const [end, setEnd] = useState<number | null>(null);
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
  const round = Math.min(card.rounds, Math.floor(elapsed / cycle) + 1);
  const rest = elapsed % cycle >= card.workSeconds;
  return (
    <section className="card">
      <h4>{card.title}</h4>
      <p>
        {card.rounds} rounds · {card.workSeconds}s work · {card.restSeconds}s
        rest
      </p>
      <p role="timer">
        {remaining
          ? `${rest ? "Rest" : "Work"} · Round ${round} · ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")} remaining`
          : "Complete"}
      </p>
      <button
        className="btn"
        disabled={!remaining}
        onClick={() => setEnd(end ? null : Date.now() + remaining * 1000)}
      >
        {end ? "Pause" : "Start"}
      </button>
      <button
        className="ghost"
        onClick={() => {
          setEnd(null);
          setRemaining(total);
        }}
      >
        Reset
      </button>
      <small>This timer does not log or verify a workout.</small>
    </section>
  );
}
export default function CoachComponents({
  cards,
}: {
  cards?: CoachComponent[];
}) {
  return (
    <div className="grid gap-3">
      {cards?.map((card, i) =>
        card.type === "timer" ? (
          <Timer key={i} card={card} />
        ) : (
          <section className="card" key={i}>
            <h4>{card.title}</h4>
            {card.type === "exercise" ? (
              <>
                <ol>
                  {card.steps.map((step, j) => (
                    <li key={j}>
                      {j + 1}. {step}
                    </li>
                  ))}
                </ol>
                {card.cue && <p className="muted">{card.cue}</p>}
              </>
            ) : (
              card.items.map((item, j) => (
                <label className="flex gap-2" key={j}>
                  <input type="checkbox" />
                  {item}
                </label>
              ))
            )}
          </section>
        ),
      )}
    </div>
  );
}
