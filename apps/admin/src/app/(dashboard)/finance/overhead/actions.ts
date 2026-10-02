"use server";

import { postOverheadAllocation } from "services";
import { OverheadBasis } from "@/db/enum";
import { runAction } from "@/lib/server/run-action";

/** Bound to its month and basis in the page (`action.bind(null, period, basis)`). */
export const postOverheadAction = async (period: string, basis: OverheadBasis) =>
  runAction(undefined, (actor) => postOverheadAllocation(actor, { period, basis }), { success: "Overhead allocated" });
