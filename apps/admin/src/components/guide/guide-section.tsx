import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Card } from "ui";
import { GuideExamples, GuideSection as GuideSectionData, guideLink } from "@/lib/guide";

type GuideSectionProps = {
  section: GuideSectionData;
  examples: GuideExamples;
};

/** One module: every page with what it does, its files, the services behind it and its spec section. */
export const GuideSection = ({ section, examples }: GuideSectionProps) => (
    <section id={section.id} className="scroll-mt-24">
      <Card title={section.title} description={section.summary}>
        <div className="flex flex-col divide-y divide-hairline-soft">
          {section.pages.map((page) => {
            const link = guideLink(page, examples);
            return (
              <article key={`${page.route}-${page.title}`} className="grid grid-cols-1 gap-4 py-4 first:pt-0 last:pb-0 xl:grid-cols-12">
                <div className="flex flex-col gap-2 xl:col-span-3">
                  <span className="text-base font-medium tracking-tight text-ink">{page.title}</span>
                  <code className="w-fit rounded-md bg-hover px-2 py-0.5 font-mono text-xs text-secondary" dir="ltr">
                    {page.route}
                  </code>
                  {link && (
                    <Link
                      href={link.href}
                      className="flex w-fit items-center gap-1 rounded-control bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                    >
                      {link.label}
                      <ArrowUpRight size={13} />
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-1 xl:col-span-4">
                  <span className="text-xs font-medium tracking-wider text-muted uppercase">What it does</span>
                  <p className="text-sm text-ink">{page.does}</p>
                  <span className="mt-2 text-xs font-medium tracking-wider text-muted uppercase">Specification</span>
                  <p className="text-sm text-secondary">{page.spec}</p>
                </div>
                <div className="flex flex-col gap-1 xl:col-span-5">
                  <span className="text-xs font-medium tracking-wider text-muted uppercase">Files</span>
                  <ul className="flex flex-col gap-0.5 font-mono text-xs text-secondary" dir="ltr">
                    <li>
                      <span className="text-faint">page </span>
                      {page.page}
                    </li>
                    {page.components.map((file) => (
                      <li key={file}>
                        <span className="text-faint">ui   </span>
                        {file}
                      </li>
                    ))}
                    {page.actions && (
                      <li>
                        <span className="text-faint">act  </span>
                        {page.actions}
                      </li>
                    )}
                  </ul>
                  <span className="mt-2 text-xs font-medium tracking-wider text-muted uppercase">Business logic (packages/services/src)</span>
                  <p className="font-mono text-xs text-secondary" dir="ltr">
                    {page.services}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </Card>
    </section>
);
