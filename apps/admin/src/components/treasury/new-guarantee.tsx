import { listProjectOptions } from "services";
import { Card } from "ui";
import { GuaranteeForm } from "./guarantee-form";

export const NewGuarantee = async () => {
  const projects = await listProjectOptions();
  return (
    <Card title="Letter of guarantee">
      <GuaranteeForm projects={[{ value: "", label: "Not tied to a project" }, ...projects]} />
    </Card>
  );
};
