import { CalendarClock, CircleX, FileInput, FileOutput } from "lucide-react";
import { listCheques } from "services";
import { Card, StatStrip, StatTile } from "ui";
import { formatMoney, round2, sumBy } from "utils";
import { CsvButton } from "@/components/shared/csv-button";
import { ChequesTable } from "./cheques-table";

type ChequesBoardProps = {
  /** "pending", "bounced", "cleared" or "all". */
  status: string;
};

export const ChequesBoard = async ({ status }: ChequesBoardProps) => {
  const cheques = await listCheques();
  const pending = cheques.filter((c) => c.status === "pending");
  const shown = status === "all" ? cheques : cheques.filter((c) => c.status === status);
  return (
    <>
      <StatStrip columns="sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          tone="warning"
          label="Issued, not cleared"
          value={formatMoney(round2(sumBy(pending.filter((c) => c.direction === "issued"), (c) => c.amount)))}
          hint="Still to leave the bank"
          icon={<FileOutput size={18} />}
        />
        <StatTile
          tone="teal"
          label="Received, not cleared"
          value={formatMoney(round2(sumBy(pending.filter((c) => c.direction === "received"), (c) => c.amount)))}
          hint="Still to be credited"
          icon={<FileInput size={18} />}
        />
        <StatTile tone="primary" label="Post-dated" value={pending.filter((c) => c.postdated).length} hint="Due after today" icon={<CalendarClock size={18} />} />
        <StatTile tone="danger" label="Bounced" value={cheques.filter((c) => c.status === "bounced").length} hint="Their invoices are open again" icon={<CircleX size={18} />} />
      </StatStrip>
      <Card
        title="Cheques"
        action={
          <CsvButton
            filename="cheques"
            rows={[
              ["Number", "Direction", "Party", "Account", "Amount", "Written", "Due", "Status", "For"],
              ...shown.map((c) => [c.number, c.direction, c.party, c.bankAccountCode, c.amount, c.issuedAt.slice(0, 10), c.dueDate.slice(0, 10), c.status, c.ref.label]),
            ]}
          />
        }
      >
        <ChequesTable cheques={shown} />
      </Card>
    </>
  );
};
