"use server";

import { redirect } from "next/navigation";
import { createCashCustody } from "services";
import { cashCustodySchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createCashCustodyAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createCashCustody(actor, input)).uuid;
    },
    { schema: cashCustodySchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/custody/${created}`);
};
