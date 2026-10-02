import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { PendingApproval } from "services";
import { EmptyState, StatusPill } from "ui";
import { ENTITY_KIND_LABELS, STAFF_ROLE_LABELS } from "@/db/label";
import { entityHref } from "@/lib/entity-href";

type ApprovalListProps = {
  items: PendingApproval[];
};

export const ApprovalList = ({ items }: ApprovalListProps) =>
  items.length === 0 ? (
    <EmptyState title="Nothing is waiting for you">Switch user at the foot of the sidebar to see another role&apos;s queue.</EmptyState>
  ) : (
    <ul className="-mx-2 flex flex-col">
      {items.map((item) => (
        <li
          key={`${item.kind}-${item.uuid}-${item.step}`}
          className="group relative flex items-center gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-hover"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-warning-tint text-warning">
            <Clock size={17} />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={entityHref(item.kind, item.uuid)} className="text-sm font-medium text-ink after:absolute after:inset-0">
                {item.number}
              </Link>
              <StatusPill>{ENTITY_KIND_LABELS[item.kind]}</StatusPill>
            </div>
            <span className="text-xs text-muted">
              {item.step} · {item.title} · waiting for <span className="text-secondary">{STAFF_ROLE_LABELS[item.waitingFor]}</span>
            </span>
          </div>
          <ChevronRight size={16} className="shrink-0 text-faint transition-colors group-hover:text-secondary rtl:-scale-x-100" />
        </li>
      ))}
    </ul>
  );
