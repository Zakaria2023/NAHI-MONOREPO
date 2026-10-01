import { ProjectsTable } from "@/components/projects/projects-table";
import { AsyncSection } from "@/components/shared/async-section";
import { FilterTabs } from "@/components/shared/filter-tabs";
import { ListSearch } from "@/components/shared/list-search";
import { PageHeader } from "@/components/shared/page-header";
import { Operator } from "@/db/enum";

type Props = {
  searchParams: Promise<{ operator?: string; search?: string }>;
};

const ProjectsPage = async ({ searchParams }: Props) => {
  const { operator: raw, search } = await searchParams;
  const operator: Operator | undefined = raw === "mobily" || raw === "stc" ? raw : undefined;
  return (
    <>
      <PageHeader
        title="Projects"
        description="Every Mobily and STC site, the stage it is in and what it still needs to move on."
        action={{ href: "/projects/new", label: "New project" }}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { label: "All", href: "/projects", active: !operator },
            { label: "Mobily", href: "/projects?operator=mobily", active: operator === "mobily" },
            { label: "STC", href: "/projects?operator=stc", active: operator === "stc" },
          ]}
        />
        <ListSearch placeholder="Search code, name, site or PO…" defaultValue={search} />
      </div>
      <AsyncSection reloadKey={`projects-${operator ?? ""}-${search ?? ""}`}>
        <ProjectsTable operator={operator} search={search} />
      </AsyncSection>
    </>
  );
};

export default ProjectsPage;
