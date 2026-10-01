"use server";

import { createSubcontract } from "services";
import { subcontractSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createSubcontractAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createSubcontract(actor, input), { schema: subcontractSchema, success: "Subcontract created" });
