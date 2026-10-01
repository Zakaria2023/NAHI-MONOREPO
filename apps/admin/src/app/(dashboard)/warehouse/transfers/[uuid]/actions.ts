"use server";

import { decideTransfer } from "services";
import { decisionSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const decideTransferAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideTransfer(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });
