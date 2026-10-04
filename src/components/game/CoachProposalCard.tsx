"use client";
import type { CoachProposal } from "@/lib/coach-actions";
export default function CoachProposalCard({
  proposal,
  status,
  busy,
  onAction,
}: {
  proposal: CoachProposal;
  status: string;
  busy: boolean;
  onAction: (action: "apply" | "dismiss") => void;
}) {
  return (
    <section className="coach-proposal">
      <div className="label">
        {status === "applied"
          ? "Saved to your account"
          : status === "dismissed"
            ? "Suggestion dismissed"
            : "Suggested change · Review before saving"}
      </div>
      {proposal.type === "training" && (
        <>
          <h4>Updated training rotation</h4>
          <p>{proposal.plan.rationale}</p>
          <details>
            <summary>Review {proposal.plan.days.length} training days</summary>
            {proposal.plan.days.map((d, i) => (
              <div className="proposal-day" key={i}>
                <strong>{d.name}</strong>
                <ul>
                  {d.exercises.map((e, j) => (
                    <li key={j}>
                      {e.name} · {e.sets} sets × {e.repMin}–{e.repMax} reps
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </details>
          <small>
            Replaces future training days. Your current workout and completed
            logs are preserved.
          </small>
        </>
      )}
      {proposal.type === "targets" && (
        <>
          <h4>Daily nutrition targets</h4>
          <p>
            <strong>{proposal.calories} kcal</strong> · {proposal.proteinMin}–
            {proposal.proteinMax}g protein / day
          </p>
        </>
      )}
      {proposal.type === "nutrition" && (
        <>
          <h4>Nutrition log · {proposal.day}</h4>
          <p>
            {proposal.calories} kcal · {proposal.proteinG}g protein
          </p>
          <small>Replaces the total recorded for this day.</small>
        </>
      )}
      {proposal.type === "goal" && (
        <>
          <h4>Change your goal</h4>
          <p>
            {
              {
                lose: "Lose weight",
                maintain: "Maintain",
                gain: "Gain weight",
              }[proposal.goal]
            }
          </p>
          <small>
            Your nutrition targets stay as they are until you review a separate
            change.
          </small>
        </>
      )}
      {proposal.type === "weight" && (
        <>
          <h4>Record current weight</h4>
          <p>{proposal.weightKg} kg</p>
          <small>Adds a weight log and updates your profile weight.</small>
        </>
      )}
      {proposal.type === "habit" && (
        <>
          <h4>New daily habit</h4>
          <p>{proposal.name}</p>
        </>
      )}
      {proposal.type === "hobbies" && (
        <>
          <h4>Update hobbies</h4>
          <p>{proposal.tags.join(" · ") || "Clear hobbies"}</p>
          <small>
            Replaces your hobbies. Shared with accepted guild members.
          </small>
        </>
      )}
      {status === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            className="btn btn-small"
            disabled={busy}
            onClick={() => onAction("apply")}
          >
            {busy ? "Saving…" : "Apply this change"}
          </button>
          <button
            type="button"
            className="ghost btn-small"
            disabled={busy}
            onClick={() => onAction("dismiss")}
          >
            Keep current
          </button>
        </div>
      )}
    </section>
  );
}
