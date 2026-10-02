"use server";

import { fileObligation } from "services";
import { taxFilingSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const fileObligationAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => fileObligation(actor, input), { schema: taxFilingSchema, success: "Filed" });
