"use server";

import { createCostCenter } from "services";
import { costCenterSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createCostCenterAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createCostCenter(actor, input), { schema: costCenterSchema, success: "Cost centre added" });
