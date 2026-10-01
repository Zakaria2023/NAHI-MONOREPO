import "server-only";
import { revalidatePath } from "next/cache";
import { Actor } from "services";
import { ZodType } from "zod";
import { ActionResult } from "@/lib/action-result";
import { requireStaff } from "./auth";

type RunOptions<T> = {
  /** Validates the raw input before the service sees it. */
  schema?: ZodType<T>;
  success?: string;
};

/**
 * The body every admin Server Action shares: resolve the caller, validate,
 * call ONE service function, revalidate, and turn a thrown rule into the
 * message the form shows. Keeping it here is what keeps the actions thin.
 */
export const runAction = async <T>(
  input: unknown,
  call: (actor: Actor, data: T) => Promise<unknown>,
  { schema, success = "Saved" }: RunOptions<T> = {},
): Promise<ActionResult> => {
  const actor = await requireStaff();
  const parsed = schema ? schema.safeParse(input) : { success: true as const, data: input as T };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  try {
    await call(actor, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
  revalidatePath("/", "layout");
  return { success };
};
