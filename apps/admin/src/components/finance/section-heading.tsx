type SectionHeadingProps = {
  title: string;
  description?: string;
};

/** The title above a full-width table or a grid of cards. */
export const SectionHeading = ({ title, description }: SectionHeadingProps) => (
  <div className="flex flex-col gap-0.5">
    <h2 className="text-base font-medium text-ink">{title}</h2>
    {description && <p className="text-sm text-muted">{description}</p>}
  </div>
);
