import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PendingApproval } from "services";
import { EmptyState, StatusPill } from "ui";
import { ENTITY_KIND_LABELS } from "@/db/label";
import { entityHref } from "@/lib/entity-href";

type ApprovalListProps = {
  items: PendingApproval[];
};

export const ApprovalList = ({ items }: ApprovalListProps) =>
  items.length === 0 ? (
    <EmptyState title="Nothing is waiting for you">Switch user in the top bar to see another role&apos;s queue.</EmptyState>
  ) : (
    <ul className="flex flex-col divide-y divide-hairline-soft">
      {items.map((item) => (
        <li key={`${item.kind}-${item.uuid}-${item.step}`} className="relative flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link href={entityHref(item.kind, item.uuid)} className="text-sm font-medium text-ink after:absolute after:inset-0 hover:text-primary">
                {item.number}
              </Link>
              <StatusPill>{ENTITY_KIND_LABELS[item.kind]}</StatusPill>
            </div>
            <span className="text-xs text-muted">{item.step} · {item.title}</span>
          </div>
          <ChevronRight size={16} className="text-faint rtl:-scale-x-100" />
        </li>
      ))}
    </ul>
  );
