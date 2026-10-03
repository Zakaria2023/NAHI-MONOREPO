import { Card } from "ui";
import { StaffDirectory } from "@/components/settings/staff-directory";
import { ActionButton } from "@/components/shared/action-button";
import { AsyncSection } from "@/components/shared/async-section";
import { PageHeader } from "@/components/shared/page-header";
import { resetDemoDataAction } from "./actions";

const SettingsPage = () => (
  <>
    <PageHeader title="Settings" description="Demo data and the staff directory the user switcher draws on." />
    <Card
      title="Demo data"
      description="Rebuilds .data/store.json from db/seed.ts, dated relative to today. Only the system admin can do this."
    >
      <ActionButton action={resetDemoDataAction} label="Reset demo data" variant="danger" />
    </Card>
    <Card title="Staff" description="Everyone who can sign in: one person per role, so every approval chain can be walked, and the employees given a sign-in.">
      <AsyncSection reloadKey="staff">
        <StaffDirectory />
      </AsyncSection>
    </Card>
  </>
);

export default SettingsPage;
