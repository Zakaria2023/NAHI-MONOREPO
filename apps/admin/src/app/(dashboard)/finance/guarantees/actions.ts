"use server";

import { releaseGuarantee } from "services";
import { runAction } from "@/lib/server/run-action";

/** Bound to its guarantee in the table. */
export const releaseGuaranteeAction = async (uuid: string) =>
  runAction(undefined, (actor) => releaseGuarantee(actor, uuid), { success: "Released" });
