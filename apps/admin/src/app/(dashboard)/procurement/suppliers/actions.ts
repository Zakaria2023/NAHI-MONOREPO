"use server";

import { createSupplier } from "services";
import { supplierSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const createSupplierAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => createSupplier(actor, input), { schema: supplierSchema, success: "Supplier registered" });
