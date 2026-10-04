import { z } from "zod";
export const nicknameSchema = z
  .string()
  .trim()
  .min(2)
  .max(24)
  .regex(
    /^[\p{L}\p{N} _-]+$/u,
    "Use letters, numbers, spaces, underscores or hyphens",
  );
