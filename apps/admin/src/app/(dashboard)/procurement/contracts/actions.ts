"use server";

import { createSupplierContract } from "services";
import { supplierContractSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createContractAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createSupplierContract(actor, input), { schema: supplierContractSchema, success: "Contract signed" });
