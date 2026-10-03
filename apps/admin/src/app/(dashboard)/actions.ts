"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaff } from "services";
import { ActionResult } from "@/lib/action-result";
import { endSession, startSession } from "@/lib/server/auth";

/** The sidebar's user switcher — the demo's way to see the app as anyone, without their password. */
export const switchUserAction = async (_prev: ActionResult, uuid: string): Promise<ActionResult> => {
  const user = await getStaff(uuid);
  if (!user) {
    return { error: "Unknown user" };
  }
  await startSession(user.uuid);
  revalidatePath("/", "layout");
  redirect("/");
};

export const signOutAction = async (): Promise<ActionResult> => {
  await endSession();
  redirect("/sign-in");
};
