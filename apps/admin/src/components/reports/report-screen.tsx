import { notFound, redirect } from "next/navigation";
import { REPORTS, ReportParams, getReport } from "services";
import { Card, StatStrip, StatTile, StatusPill } from "ui";
import { CsvButton } from "@/components/shared/csv-button";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { PageHeader } from "@/components/shared/page-header";
import { PrintButton } from "@/components/shared/print-button";
import { ChoicePicker } from "./choice-picker";
import { ReportTable } from "./report-table";
import { formatReportCell } from "@/lib/format-report-cell";

type ReportScreenProps = {
  slug: string;
  params: ReportParams;
};

/** Any report of the catalogue: its choices, its headline figures, the table, Excel and print. */
export const ReportScreen = async ({ slug, params }: ReportScreenProps) => {
  const report = await getReport(slug, params);
  if (!report) {
    const screen = REPORTS.find((r) => r.slug === slug)?.href;
    if (screen) {
      redirect(screen);
    }
    notFound();
  }
  const query = (param: string, value: string) => {
    const next = new URLSearchParams(Object.entries({ ...params, [param]: value }).filter((e): e is [string, string] => Boolean(e[1])));
    return `/reports/${slug}?${next.toString()}`;
  };
  return (
    <>
      <PageHeader title={report.title} description={report.description} back={{ href: "/reports", label: "Reports" }} meta={<StatusPill>{report.source}</StatusPill>} />
      {report.choices?.map((choice) =>
        choice.options.length <= 8 ? (
          <FilterTabs key={choice.param} tabs={choice.options.map((o) => ({ label: o.label, href: query(choice.param, o.value), active: o.value === choice.selected }))} />
        ) : (
          <div key={choice.param} className="w-full max-w-md print:hidden">
            <ChoicePicker label={choice.label} options={choice.options.map((o) => ({ value: o.value, label: o.label, href: query(choice.param, o.value) }))} selected={choice.selected} />
          </div>
        ),
      )}
      {report.figures && report.figures.length > 0 && (
        <StatStrip columns={report.figures.length >= 3 ? "sm:grid-cols-3" : report.figures.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-1"}>
          {report.figures.map((f) => (
            <StatTile key={f.label} label={f.label} value={formatReportCell(f.value, f.kind)} hint={f.hint} />
          ))}
        </StatStrip>
      )}
      <Card
        title={report.title}
        description={report.note}
        action={
          <div className="flex flex-wrap gap-2">
            <CsvButton
              filename={slug}
              rows={[report.columns.map((c) => c.header), ...report.rows.map((r) => report.columns.map((c) => r.cells[c.key] ?? ""))]}
            />
            <PrintButton />
          </div>
        }
      >
        <ReportTable columns={report.columns} rows={report.rows} />
      </Card>
    </>
  );
};
