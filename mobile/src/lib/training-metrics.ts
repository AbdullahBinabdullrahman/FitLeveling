export type Tracking = "reps" | "duration" | "distance" | "intervals";
export type Targets = {
  durationSeconds?: number;
  distanceMeters?: number;
  speedKph?: number;
  inclinePercent?: number;
  restSeconds?: number;
  notes?: string;
};
export type Prescription = Targets & {
  tracking?: Tracking;
  sets: number;
  repMin?: number | null;
  repMax?: number | null;
};
export function exerciseSummary(e: Prescription) {
  if (!e.tracking || e.tracking === "reps")
    return `${e.sets} sets × ${e.repMin ?? "—"}–${e.repMax ?? "—"} reps`;
  return [
    e.tracking === "intervals"
      ? `${e.sets} rounds`
      : `${e.sets} block${e.sets === 1 ? "" : "s"}`,
    e.durationSeconds ? `${e.durationSeconds / 60} min` : "",
    e.distanceMeters ? `${e.distanceMeters / 1000} km` : "",
    e.speedKph ? `${e.speedKph} km/h` : "",
    e.inclinePercent != null ? `${e.inclinePercent}% incline` : "",
    e.restSeconds ? `${e.restSeconds}s rest` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}
