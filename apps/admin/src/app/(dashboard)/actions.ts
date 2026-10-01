"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getStaff } from "services";
import { ActionResult } from "@/lib/action-result";
import { STAFF_COOKIE } from "@/lib/server/auth";

/** The navbar's user switcher — the MVP's stand-in for signing in as someone. */
export const switchUserAction = async (_prev: ActionResult, uuid: string): Promise<ActionResult> => {
  const user = await getStaff(uuid);
  if (!user) {
    return { error: "Unknown user" };
  }
  (await cookies()).set(STAFF_COOKIE, user.uuid, { path: "/", sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
  return { success: `Acting as ${user.name}` };
};
