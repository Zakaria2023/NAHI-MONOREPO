import { Card, Table } from "ui";
import { GUIDE_RULES } from "@/lib/guide";

/** Every numbered rule of the specifications, where it is enforced, and the test that guards it. */
export const GuideRules = () => (
  <section id="rules" className="scroll-mt-24">
    <Card title="Every business rule" description="Enforced in packages/services/src; each has a test there that fails if the rule is removed (pnpm test).">
      <Table
        data={GUIDE_RULES}
        rowKey={(r) => r.rule}
        columns={[
          { key: "rule", header: "Rule", render: (r) => <span className="text-ink">{r.rule}</span> },
          { key: "where", header: "Enforced in", render: (r) => <code className="font-mono text-xs text-secondary" dir="ltr">{r.where}</code> },
          { key: "test", header: "Test", render: (r) => <code className="font-mono text-xs text-secondary" dir="ltr">{r.test}</code> },
        ]}
      />
    </Card>
  </section>
);
