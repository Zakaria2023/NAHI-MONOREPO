import { z } from "zod";

export const email = z.string().trim().toLowerCase().email("Enter a valid e-mail");
