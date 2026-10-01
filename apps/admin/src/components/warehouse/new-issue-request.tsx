import { listItemOptions, listProjectOptions, listSubcontractors, listWarehouseOptions } from "services";
import { Card } from "ui";
import { IssueRequestForm } from "./issue-request-form";

/** Loads the pickers, then hands them to the form. */
export const NewIssueRequest = async () => {
  const [projects, warehouses, items, subcontractors] = await Promise.all([
    listProjectOptions(),
    listWarehouseOptions(),
    listItemOptions(),
    listSubcontractors(),
  ]);
  return (
    <Card
      title="Issue request"
      description="Name who receives the stock. A fixed asset is issued only to an employee and stays in their custody until it is returned."
    >
      <IssueRequestForm
        projects={projects}
        warehouses={warehouses}
        items={items}
        subcontractors={subcontractors.map((s) => ({ value: s.uuid, label: s.name, hint: s.crNumber }))}
      />
    </Card>
  );
};
