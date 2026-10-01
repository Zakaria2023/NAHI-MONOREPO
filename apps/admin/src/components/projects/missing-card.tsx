import { CircleDashed } from "lucide-react";
import { Card } from "ui";

type MissingCardProps = {
  items: string[];
};

/** What the current stage still needs — the per-PO "missing documents" view. */
export const MissingCard = ({ items }: MissingCardProps) => (
  <Card title="Still missing" description="In the current stage">
    {items.length === 0 ? (
      <p className="text-sm text-success">Nothing — ready for the next step.</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-ink">
            <CircleDashed size={15} className="mt-0.5 shrink-0 text-warning" />
            {item}
          </li>
        ))}
      </ul>
    )}
  </Card>
);
