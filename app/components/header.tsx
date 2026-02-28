"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "./theme-provider";

interface Breadcrumb {
  label: string;
  href?: string;
}

function formatLabel(label: string) {
  return label.toLocaleUpperCase();
}

export function Header({
  breadcrumbs,
  showPath = true,
}: {
  breadcrumbs?: Breadcrumb[];
  showPath?: boolean;
}) {
  const { theme, toggle } = useTheme();
  const crumbs = breadcrumbs ?? [];

  const archiveSrc = theme === "dark" ? "/archive-white.png" : "/archive.png";
  const tenetSrc = theme === "dark" ? "/tenet-white.png" : "/tenet.png";
  const iconSrc = theme === "dark" ? "/archive-icon-white.png" : "/archive-icon.png";

  const lastCrumbLabel = crumbs.length
    ? formatLabel(crumbs[crumbs.length - 1]?.label ?? "")
    : null;

  return (
    <header className="sticky top-0 z-50 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-4 py-4 sm:px-6">
      <Link href="/" className="flex flex-col items-start ml-2 sm:ml-4">
        {/* Full logo — visible from md up */}
        <Image
          src={archiveSrc}
          alt="ARCHIVE"
          width={960}
          height={480}
          priority
          className="hidden h-42 w-auto lg:block"
        />
        <Image
          src={tenetSrc}
          alt="TENET"
          width={480}
          height={480}
          priority
          className="hidden h-28 w-auto -mt-26 ml-32 lg:block"
        />
        {/* Icon only — visible below md */}
        <Image
          src={iconSrc}
          alt="ARCHIVE"
          width={480}
          height={480}
          priority
          className="h-15 w-15 md:h-20 md:w-20 lg:hidden"
        />
      </Link>

      <nav className="flex min-w-0 items-center justify-center gap-2 text-sm text-muted">
        {showPath && (
          <>
            {/* Full path — ARCHIVE always shown, then optional breadcrumbs */}
            <div className="hidden gap-2 -ml-20 md:flex md:items-center">
              <Link href="/" className="transition-colors hover:text-foreground">
                ARCHIVE
              </Link>
              {crumbs.map((crumb, i) => (
                <span
                  key={`${crumb.href ?? "current"}-${crumb.label}-${i}`}
                  className="flex items-center gap-2"
                >
                  <span>/</span>
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="transition-colors hover:text-foreground"
                    >
                      {formatLabel(crumb.label)}
                    </Link>
                  ) : (
                    <span className="text-foreground">
                      {formatLabel(crumb.label)}
                    </span>
                  )}
                </span>
              ))}
            </div>
            {/* Truncated path — visible below md */}
            <div className="truncate md:hidden">
              {lastCrumbLabel != null ? (
                <>
                  <span className="text-muted">…/</span>
                  <span className="text-foreground">{lastCrumbLabel}</span>
                </>
              ) : (
                <span className="text-foreground">ARCHIVE</span>
              )}
            </div>
          </>
        )}
      </nav>

      <button
        onClick={toggle}
        className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-surface text-foreground transition-colors hover:bg-surface-alt"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </header>
  );
}
