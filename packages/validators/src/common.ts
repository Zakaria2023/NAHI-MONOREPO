import { z } from "zod";

export const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

export const optionalNote = z.string().trim().max(500).optional();

export const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`).max(200);

export const money = z.coerce.number<string | number>().min(0, "Cannot be negative");

export const positiveQty = z.coerce.number<string | number>().positive("Must be more than 0");
