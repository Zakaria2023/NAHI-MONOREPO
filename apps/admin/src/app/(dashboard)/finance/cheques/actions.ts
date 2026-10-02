"use server";

import { bounceCheque, clearCheque } from "services";
import { bounceChequeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

// Bound to their cheque in the table (`action.bind(null, uuid)`).

export const clearChequeAction = async (uuid: string) =>
  runAction(undefined, (actor) => clearCheque(actor, uuid), { success: "Cheque cleared" });

export const bounceChequeAction = async (uuid: string, _prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => bounceCheque(actor, uuid, input), { schema: bounceChequeSchema, success: "Bounce recorded" });
