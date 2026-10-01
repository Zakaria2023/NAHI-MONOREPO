import { ArrowDown } from "lucide-react";
import { Card } from "ui";
import { GUIDE_LAYERS } from "@/lib/guide";

/** The seven layers every screen is built from, top to bottom. */
export const GuideLayers = () => (
  <section id="how-it-works" className="scroll-mt-24">
    <Card title="How a page is built" description="Every screen uses the same layers, and each one only talks to the one below it.">
      <ol className="flex flex-col gap-1">
        {GUIDE_LAYERS.map((layer, index) => (
          <li key={layer.layer} className="flex flex-col items-start gap-1">
            <div className="grid w-full grid-cols-1 items-center gap-2 rounded-control border border-hairline-soft px-4 py-3 md:grid-cols-12">
              <span className="text-sm font-medium text-ink md:col-span-2">
                {index + 1}. {layer.layer}
              </span>
              <code className="font-mono text-xs text-primary md:col-span-5" dir="ltr">
                {layer.path}
              </code>
              <span className="text-sm text-secondary md:col-span-5">{layer.role}</span>
            </div>
            {index < GUIDE_LAYERS.length - 1 && <ArrowDown size={14} className="ms-6 text-faint" />}
          </li>
        ))}
      </ol>
    </Card>
  </section>
);
