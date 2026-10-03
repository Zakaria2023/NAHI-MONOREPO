import { listSupplierContracts } from "services";
import { ContractsTable } from "./contracts-table";

export const ContractsBoard = async () => {
  const contracts = await listSupplierContracts();
  return <ContractsTable contracts={contracts} />;
};
