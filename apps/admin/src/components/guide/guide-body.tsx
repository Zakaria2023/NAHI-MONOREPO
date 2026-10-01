import { GUIDE_SECTIONS } from "@/lib/guide";
import { resolveGuideExamples } from "@/lib/server/guide-examples";
import { GuideContents } from "./guide-contents";
import { GuideLayers } from "./guide-layers";
import { GuideRules } from "./guide-rules";
import { GuideSection } from "./guide-section";

export const GuideBody = async () => {
  const examples = await resolveGuideExamples();
  return (
    <>
      <GuideContents examples={examples} />
      <GuideLayers />
      {GUIDE_SECTIONS.map((section) => (
        <GuideSection key={section.id} section={section} examples={examples} />
      ))}
      <GuideRules />
    </>
  );
};
