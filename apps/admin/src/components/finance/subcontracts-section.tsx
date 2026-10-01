import { listSubcontracts } from "services";
import { SubcontractsTable } from "./subcontracts-table";

export const SubcontractsSection = async () => {
  const subcontracts = await listSubcontracts();
  return <SubcontractsTable subcontracts={subcontracts} />;
};
