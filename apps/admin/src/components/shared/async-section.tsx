"use client";

import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "./error-boundary";
import { SectionError } from "./section-error";
import { SectionSkeleton } from "./section-skeleton";

type AsyncSectionProps = {
  /** Derived from the search params, so a new filter shows the skeleton again. */
  reloadKey: string;
  children: ReactNode;
};

/** The keyed Suspense + error boundary every data-dependent section sits in. */
export const AsyncSection = ({ reloadKey, children }: AsyncSectionProps) => (
  <ErrorBoundary key={reloadKey} fallback={(error, retry) => <SectionError error={error} retry={retry} />}>
    <Suspense key={reloadKey} fallback={<SectionSkeleton />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);
