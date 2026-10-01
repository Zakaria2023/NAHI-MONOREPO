"use client";

import { Button } from "ui";

type SectionErrorProps = {
  error: Error;
  retry: () => void;
};

export const SectionError = ({ error, retry }: SectionErrorProps) => (
  <div className="flex flex-col items-start gap-3 rounded-card border border-danger-tint bg-danger-tint px-5 py-4">
    <p className="text-sm text-danger">{error.message || "This section could not be loaded."}</p>
    <Button variant="outline" size="sm" onClick={retry}>
      Try again
    </Button>
  </div>
);
