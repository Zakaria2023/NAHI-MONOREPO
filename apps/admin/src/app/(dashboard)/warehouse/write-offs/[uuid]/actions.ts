"use server";

import { decideWriteOff } from "services";
import { decisionSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const decideWriteOffAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideWriteOff(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });
