"use server";

import { decideCashCustody, disburseCashCustody, settleCashCustody } from "services";
import { decisionSchema, settleCustodySchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to the custody in the page (`action.bind(null, uuid)`).

export const decideCashCustodyAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => decideCashCustody(actor, uuid, input), { schema: decisionSchema, success: "Decision recorded" });

export const disburseCashCustodyAction = async (uuid: string) =>
  runAction(undefined, (actor) => disburseCashCustody(actor, uuid), { success: "Disbursed — receipt signed" });

export const settleCashCustodyAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => settleCashCustody(actor, uuid, input), { schema: settleCustodySchema, success: "Custody settled" });
