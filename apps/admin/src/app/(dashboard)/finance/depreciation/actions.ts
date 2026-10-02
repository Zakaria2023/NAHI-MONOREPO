"use server";

import { postDepreciation } from "services";
import { runAction } from "@/lib/server/run-action";

/** Bound to its month in the page (`action.bind(null, period)`). */
export const postDepreciationAction = async (period: string) =>
  runAction({ period }, (actor) => postDepreciation(actor, { period }), { success: "Depreciation posted" });
