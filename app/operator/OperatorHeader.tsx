"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "../components/header";

const BASE = "/operator";

function formatSegment(segment: string): string {
  return decodeURIComponent(segment).replace(/-/g, " ");
}

export function OperatorHeader() {
  const pathname = usePathname();
  const segments = pathname?.replace(BASE, "").split("/").filter(Boolean) ?? [];

  const breadcrumbs =
    segments.length === 0
      ? []
      : segments.length === 1
        ? [{ label: formatSegment(segments[0]) }]
        : [
            {
              label: formatSegment(segments[0]),
              href: `${BASE}/${segments[0]}`,
            },
            { label: formatSegment(segments[1]) },
          ];

  return (
    <Header
      breadcrumbs={breadcrumbs}
      rootHref={BASE}
      bottomSlot={
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-foreground">Operator mode</span>
          <span>uncached data from GitHub</span>
          <Link href="/operator/new-category" className="underline hover:text-foreground">
            New category
          </Link>
          <Link href="/operator/new-course" className="underline hover:text-foreground">
            New course
          </Link>
          <form action="/operator/logout" method="post" className="inline">
            <button type="submit" className="underline hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      }
    />
  );
}
