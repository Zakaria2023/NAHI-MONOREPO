"use server";

import { createGuarantee, releaseGuarantee } from "services";
import { guaranteeSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createGuaranteeAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createGuarantee(actor, input), { schema: guaranteeSchema, success: "Letter of guarantee recorded" });

/** Bound to its guarantee in the table. */
export const releaseGuaranteeAction = async (uuid: string) =>
  runAction(undefined, (actor) => releaseGuarantee(actor, uuid), { success: "Released" });
