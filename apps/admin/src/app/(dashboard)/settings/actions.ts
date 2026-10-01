"use server";

import { resetDemoData } from "services";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const resetDemoDataAction = async (): Promise<ActionResult> =>
  runAction(undefined, (actor) => resetDemoData(actor), { success: "Demo data rebuilt" });
