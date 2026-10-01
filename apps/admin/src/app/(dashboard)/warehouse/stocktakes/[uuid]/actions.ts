"use server";

import { decideStocktake } from "services";
import { decisionSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const decideStocktakeAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideStocktake(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });
