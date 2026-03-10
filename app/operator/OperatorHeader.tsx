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
  const breadcrumbs = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href:
      index < segments.length - 1
        ? `${BASE}/${segments.slice(0, index + 1).join("/")}`
        : undefined,
  }));

  return (
    <Header
      breadcrumbs={breadcrumbs}
      rootHref={BASE}
      bottomSlot={
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-foreground">Operator mode</span>
          <span>uncached data from GitHub</span>
          <Link href="/operator/new-folder" className="underline hover:text-foreground">
            New folder
          </Link>
          <Link href="/operator/new-article" className="underline hover:text-foreground">
            New article
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
