"use server";

import { redirect } from "next/navigation";
import { createWriteOff } from "services";
import { writeOffSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createWriteOffAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createWriteOff(actor, input)).uuid;
    },
    { schema: writeOffSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/warehouse/write-offs/${created}`);
};
