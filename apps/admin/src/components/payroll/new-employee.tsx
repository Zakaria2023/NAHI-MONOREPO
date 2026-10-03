import { listProjectOptions } from "services";
import { Card } from "ui";
import { EmployeeForm } from "./employee-form";

export const NewEmployee = async () => {
  const projects = await listProjectOptions();
  return (
    <Card title="Employee" description="The IBAN is where the salary transfer goes; the default project takes the cost when a timesheet does not split it">
      <EmployeeForm projects={[{ value: "", label: "Head office (overhead)" }, ...projects]} />
    </Card>
  );
};
