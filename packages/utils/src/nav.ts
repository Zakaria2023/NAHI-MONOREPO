/**
 * The one nav link that should be lit for `pathname`: the deepest href that
 * covers it. "Covers" means equal, or a prefix ending at a segment boundary, so
 * `/projects` lights for `/projects/abc` but `/pro` lights for nothing.
 */
export const activeNavHref = (
  pathname: string,
  hrefs: readonly string[],
): string | null =>
  hrefs
    .filter(
      (href) =>
        pathname === href ||
        (href === "/" ? false : pathname.startsWith(`${href}/`)),
    )
    .reduce<string | null>(
      (best, href) => (best === null || href.length > best.length ? href : best),
      null,
    );
