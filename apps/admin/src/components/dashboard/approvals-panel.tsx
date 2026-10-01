import Link from "next/link";
import { listPendingApprovals } from "services";
import { Card } from "ui";
import { ApprovalList } from "@/components/shared/approval-list";
import { getCurrentStaff } from "@/lib/server/auth";

export const ApprovalsPanel = async () => {
  const actor = await getCurrentStaff();
  const items = await listPendingApprovals(actor.role);
  return (
    <Card
      title="Waiting for you"
      description="Each step stops at the role that has to act on it"
      action={
        <Link href="/approvals" className="text-sm text-primary hover:underline">
          View all
        </Link>
      }
    >
      <ApprovalList items={items.slice(0, 6)} />
    </Card>
  );
};
