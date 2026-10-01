import { MobilyDetail } from "services";
import { Card } from "ui";
import { formatRelativeDate } from "utils";
import { FactList } from "@/components/shared/fact-list";

type KeyDatesCardProps = {
  detail: MobilyDetail;
};

/** Rules 6 and 9: the two dates the system works out and watches. */
export const KeyDatesCard = ({ detail }: KeyDatesCardProps) => (
  <Card title="Key dates" description="Computed from the certificates">
    <FactList
      columns={1}
      facts={[
        { label: "FAC opens (PAC + 1 year)", value: formatRelativeDate(detail.facEligibleAt) },
        { label: "Final Clearance due (Stage 2 + 2 years)", value: formatRelativeDate(detail.finalClearanceDueAt) },
        {
          label: "Next permit to expire",
          value: formatRelativeDate(
            detail.permits
              .filter((p) => p.issuedAt)
              .map((p) => p.expiresAt)
              .sort()[0] ?? null,
          ),
        },
      ]}
    />
  </Card>
);
