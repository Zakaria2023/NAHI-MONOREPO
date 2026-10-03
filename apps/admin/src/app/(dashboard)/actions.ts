"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaff } from "services";
import { ActionResult } from "@/lib/action-result";
import { actAs } from "@/lib/server/auth";

/** The navbar's user switcher — the MVP's stand-in for signing in. Lands on the new user's own dashboard. */
export const switchUserAction = async (_prev: ActionResult, uuid: string): Promise<ActionResult> => {
  const user = await getStaff(uuid);
  if (!user) {
    return { error: "Unknown user" };
  }
  await actAs(user.uuid);
  revalidatePath("/", "layout");
  redirect("/");
};
