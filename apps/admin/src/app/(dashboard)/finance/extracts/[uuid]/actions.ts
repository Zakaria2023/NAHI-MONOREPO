"use server";

import { decideExtract, markExtractPaid } from "services";
import { extractDecisionSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the extract in the detail component (`action.bind(null, uuid)`).

export const decideExtractAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideExtract(actor, uuid, input), { schema: extractDecisionSchema, success: "Decision recorded" });

export const markExtractPaidAction = async (uuid: string) =>
  runAction(undefined, (actor) => markExtractPaid(actor, uuid), { success: "Extract marked paid" });
