import { listPendingApprovals } from "services";
import { Card } from "ui";
import { STAFF_ROLE_LABELS } from "@/db/label";
import { ApprovalList } from "@/components/shared/approval-list";
import { getCurrentStaff } from "@/lib/server/auth";

export const ApprovalsBoard = async () => {
  const actor = await getCurrentStaff();
  const items = await listPendingApprovals(actor.role);
  return (
    <Card title={actor.role === "system_admin" ? `${items.length} waiting across every role` : `${items.length} waiting for ${STAFF_ROLE_LABELS[actor.role]}`}>
      <ApprovalList items={items} />
    </Card>
  );
};
