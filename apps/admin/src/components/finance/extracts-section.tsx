import { listExtracts } from "services";
import { ExtractsTable } from "./extracts-table";

export type ExtractFilter = "all" | "pending" | "approved" | "paid" | "rejected";

type ExtractsSectionProps = {
  filter: ExtractFilter;
};

const PENDING = ["submitted", "engineer_approved", "pm_approved"];

export const ExtractsSection = async ({ filter }: ExtractsSectionProps) => {
  const extracts = (await listExtracts()).filter((e) =>
    filter === "all" ? true : filter === "pending" ? PENDING.includes(e.status) : e.status === filter,
  );
  return (
    <ExtractsTable
      extracts={extracts}
      emptyMessage={
        filter === "all"
          ? "No extract yet. Subcontractors submit them from the portal, or enter one here with New extract."
          : "No extract in this view."
      }
    />
  );
};
