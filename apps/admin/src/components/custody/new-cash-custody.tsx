import { listProjectOptions } from "services";
import { Card } from "ui";
import { CashCustodyForm } from "./cash-custody-form";

export const NewCashCustody = async () => {
  const projects = await listProjectOptions();
  return (
    <Card
      title="Custody receipt"
      description="One custody per employee and project at a time: the old one must be settled first. The amount must fit the project's budget."
    >
      <CashCustodyForm projects={projects} />
    </Card>
  );
};
