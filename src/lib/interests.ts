import { z } from "zod";
export const tagsSchema = z
  .array(z.string().trim().min(1).max(24))
  .max(12)
  .transform((tags) =>
    Array.from(new Map(tags.map((t) => [t.toLowerCase(), t])).values()),
  );
