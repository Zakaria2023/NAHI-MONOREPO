import { ArrowUpRight, Hash } from "lucide-react";
import Link from "next/link";
import { Card } from "ui";
import { GUIDE_SECTIONS, GuideExamples, guideLink } from "@/lib/guide";

type GuideContentsProps = {
  examples: GuideExamples;
};

/** The table of contents: each section jumps to its table, each page opens the page itself. */
export const GuideContents = ({ examples }: GuideContentsProps) => (
    <Card title="Table of contents" description="A section opens its table below; a page opens the page itself.">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Link href="#how-it-works" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary">
            <Hash size={14} className="text-faint" />
            How a page is built
          </Link>
          <Link href="#rules" className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary">
            <Hash size={14} className="text-faint" />
            Every business rule
          </Link>
        </div>
        {GUIDE_SECTIONS.map((section) => (
          <div key={section.id} className="flex flex-col gap-1.5">
            <Link href={`#${section.id}`} className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-primary">
              <Hash size={14} className="text-faint" />
              {section.title}
            </Link>
            <ul className="flex flex-col gap-1 ps-5">
              {section.pages.map((page) => {
                const href = guideLink(page, examples)?.href;
                return (
                  <li key={`${page.route}-${page.title}`}>
                    {href ? (
                      <Link href={href} className="group flex items-center gap-1 text-sm text-secondary hover:text-primary">
                        {page.title}
                        <ArrowUpRight size={12} className="text-faint group-hover:text-primary" />
                      </Link>
                    ) : (
                      <span className="text-sm text-muted">{page.title}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Card>
);
