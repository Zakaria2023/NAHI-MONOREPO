"use server";

import { closeAssetCustody, countAssetCustody } from "services";
import { AssetReturnInput, assetReturnSchema } from "validators";
import { ASSET_CUSTODY_STATUS_LABELS } from "@/db/label";
import { runAction } from "@/lib/server/run-action";

// Bound per row in the table (`action.bind(null, uuid, …)`).

export const countAssetCustodyAction = async (uuid: string) =>
  runAction(undefined, (actor) => countAssetCustody(actor, uuid), { success: "Count recorded" });

export const closeAssetCustodyAction = async (uuid: string, status: AssetReturnInput["status"]) =>
  runAction({ status }, (actor, input) => closeAssetCustody(actor, uuid, input), {
    schema: assetReturnSchema,
    success: `Custody closed as ${ASSET_CUSTODY_STATUS_LABELS[status].toLowerCase()}`,
  });
