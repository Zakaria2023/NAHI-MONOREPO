"use server";

import { getStaff, getStaffByEmail, resetDemoData } from "services";
import { ActionResult } from "@/lib/action-result";
import { actAs, requireStaff } from "@/lib/server/auth";
import { runAction } from "@/lib/server/run-action";

/** The rebuilt store has new ids, so the session moves to the same person's new record — found by e-mail. */
export const resetDemoDataAction = async (): Promise<ActionResult> => {
  const me = await getStaff((await requireStaff()).uuid);
  const result = await runAction(undefined, (actor) => resetDemoData(actor), { success: "Demo data rebuilt" });
  const again = me && !result.error ? await getStaffByEmail(me.email) : null;
  if (again) {
    await actAs(again.uuid);
  }
  return result;
};
