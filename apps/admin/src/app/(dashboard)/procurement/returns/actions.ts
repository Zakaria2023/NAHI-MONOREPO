"use server";

import { receiveReplacement } from "services";
import { runAction } from "@/lib/server/run-action";

// Bound to its return in the table (`action.bind(null, uuid)`).

export const receiveReplacementAction = async (uuid: string) =>
  runAction(undefined, (actor) => receiveReplacement(actor, uuid), { success: "Replacement received" });
