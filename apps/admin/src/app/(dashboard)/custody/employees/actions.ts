"use server";

import { approveClearance } from "services";
import { clearanceSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const approveClearanceAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => approveClearance(actor, input), { schema: clearanceSchema, success: "Clearance approved" });
