"use server";

import { redirect } from "next/navigation";
import { createTransfer } from "services";
import { transferSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createTransferAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createTransfer(actor, input)).uuid;
    },
    { schema: transferSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/warehouse/transfers/${created}`);
};
