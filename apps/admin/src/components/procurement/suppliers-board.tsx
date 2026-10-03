import { listSuppliers } from "services";
import { SuppliersTable } from "./suppliers-table";

export const SuppliersBoard = async () => {
  const suppliers = await listSuppliers();
  return <SuppliersTable suppliers={suppliers} />;
};
