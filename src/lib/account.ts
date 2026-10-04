import { z } from "zod";
export const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid timezone, such as Asia/Riyadh");
export const accountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  timezone: timezoneSchema,
  currentPassword: z.string().max(200).optional(),
  newPassword: z
    .string()
    .min(10)
    .max(72)
    .refine(
      (v) => new TextEncoder().encode(v).length <= 72,
      "Password must be at most 72 UTF-8 bytes",
    )
    .optional(),
});
