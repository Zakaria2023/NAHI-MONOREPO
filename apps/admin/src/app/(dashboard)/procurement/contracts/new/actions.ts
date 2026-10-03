"use server";

import { redirect } from "next/navigation";
import { createSupplierContract } from "services";
import { supplierContractSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createContractAction = async (_prev: ActionResult, data: unknown): Promise<ActionResult> => {
  let created = "";
  const result = await runAction(
    data,
    async (actor, input) => {
      created = (await createSupplierContract(actor, input)).uuid;
    },
    { schema: supplierContractSchema },
  );
  if (result.error) {
    return result;
  }
  redirect(`/procurement/contracts/${created}`);
};
