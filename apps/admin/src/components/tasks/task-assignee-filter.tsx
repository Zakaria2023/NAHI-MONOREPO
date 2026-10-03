import { listTaskAssignees } from "services";
import { ChoicePicker } from "@/components/reports/choice-picker";

type TaskAssigneeFilterProps = {
  view: string;
  selected?: string;
};

/** Narrows the task list to one person; keeps the tab that is open. */
export const TaskAssigneeFilter = async ({ view, selected }: TaskAssigneeFilterProps) => {
  const staff = await listTaskAssignees();
  return (
    <div className="w-full max-w-xs">
      <ChoicePicker
        label="Assigned to"
        selected={selected ?? ""}
        options={[
          { value: "", label: "Everyone", href: `/tasks?view=${view}` },
          ...staff.map((s) => ({ ...s, href: `/tasks?view=${view}&assignee=${s.value}` })),
        ]}
      />
    </div>
  );
};
