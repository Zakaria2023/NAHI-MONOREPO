export const SectionSkeleton = () => (
  <div className="flex flex-col gap-3 rounded-card border border-hairline bg-surface p-5">
    {[0, 1, 2, 3].map((row) => (
      <div key={row} className="h-5 animate-pulse rounded-md bg-hairline-soft" />
    ))}
  </div>
);
