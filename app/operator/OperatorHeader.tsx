"use client";

import { usePathname } from "next/navigation";
import { Header } from "../components/header";

const BASE = "/operator";

export function OperatorHeader() {
  const pathname = usePathname();
  const segments = pathname?.replace(BASE, "").split("/").filter(Boolean) ?? [];

  const breadcrumbs =
    segments.length === 0
      ? []
      : segments.length === 1
        ? [{ label: decodeURIComponent(segments[0]) }]
        : [
            {
              label: decodeURIComponent(segments[0]),
              href: `${BASE}/${segments[0]}`,
            },
            { label: decodeURIComponent(segments[1]) },
          ];

  return <Header breadcrumbs={breadcrumbs} />;
}
