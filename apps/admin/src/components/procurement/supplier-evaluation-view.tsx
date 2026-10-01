import { SupplierEvaluation } from "services";
import { formatDateTime } from "utils";
import { FactList } from "@/components/shared/fact-list";

type SupplierEvaluationViewProps = {
  evaluation: SupplierEvaluation;
};

export const SupplierEvaluationView = ({ evaluation }: SupplierEvaluationViewProps) => (
  <div className="flex flex-col gap-3">
    <FactList
      columns={4}
      facts={[
        { label: "Quality", value: `${evaluation.quality} / 5` },
        { label: "On time", value: `${evaluation.onTime} / 5` },
        { label: "Price", value: `${evaluation.price} / 5` },
        { label: "Evaluated by", value: `${evaluation.by} · ${formatDateTime(evaluation.at)}` },
      ]}
    />
    {evaluation.note && <p className="border-t border-hairline-soft pt-3 text-sm text-secondary">{evaluation.note}</p>}
  </div>
);
