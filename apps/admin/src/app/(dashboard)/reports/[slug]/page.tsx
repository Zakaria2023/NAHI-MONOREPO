import { ReportScreen } from "@/components/reports/report-screen";
import { AsyncSection } from "@/components/shared/async-section";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ account?: string; party?: string; year?: string; period?: string; item?: string }>;
};

const ReportPage = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const choices = await searchParams;
  return (
    <AsyncSection reloadKey={`${slug}-${JSON.stringify(choices)}`}>
      <ReportScreen slug={slug} params={choices} />
    </AsyncSection>
  );
};

export default ReportPage;
