"use server";

import { redirect } from "next/navigation";
import { signIn } from "services";
import { signInSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { startSession } from "@/lib/server/auth";

/** No `runAction` here: nobody is signed in yet, so there is no actor to resolve. */
export const signInAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  const parsed = signInSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  let uuid = "";
  try {
    uuid = (await signIn(parsed.data)).uuid;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not sign in" };
  }
  await startSession(uuid);
  redirect("/");
};
