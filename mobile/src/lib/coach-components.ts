export type CoachComponent =
  | { type: "image"; title: string; src: string; alt: string; caption?: string }
  | { type: "exercise"; title: string; steps: string[]; cue?: string }
  | {
      type: "timer";
      title: string;
      workSeconds: number;
      restSeconds: number;
      rounds: number;
    }
  | { type: "checklist"; title: string; items: string[] };
