import { closeAssetCustodyAction, countAssetCustodyAction } from "@/app/(dashboard)/warehouse/custody/actions";
import { ActionButton } from "@/components/shared/action-button";
import { BlockedNote } from "./blocked-note";

type AssetCustodyActionsProps = {
  uuid: string;
  countBlocker: string | null;
  closeBlocker: string | null;
};

/** The periodic count, and closing the custody as returned, lost or damaged. */
export const AssetCustodyActions = ({ uuid, countBlocker, closeBlocker }: AssetCustodyActionsProps) => (
  <div className="flex flex-col items-end gap-2">
    <div className="flex flex-wrap justify-end gap-2">
      <ActionButton action={countAssetCustodyAction.bind(null, uuid)} label="Record count" size="sm" blocker={countBlocker} />
      {!closeBlocker && (
        <>
          <ActionButton action={closeAssetCustodyAction.bind(null, uuid, "returned")} label="Returned" variant="outline" size="sm" />
          <ActionButton action={closeAssetCustodyAction.bind(null, uuid, "lost")} label="Lost" variant="outline" size="sm" />
          <ActionButton action={closeAssetCustodyAction.bind(null, uuid, "damaged")} label="Damaged" variant="outline" size="sm" />
        </>
      )}
    </div>
    {closeBlocker && <BlockedNote reason={closeBlocker} />}
  </div>
);
