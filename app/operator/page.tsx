import { getFolderContentsByPath, routeForPath } from "@/lib/github";
import Link from "next/link";
import { OperatorFolderGrid } from "./OperatorFolderGrid";
import { OperatorFileGrid } from "./OperatorFileGrid";

const OP = { noCache: true as const };
const BASE = "/operator";

export default async function OperatorHome() {
  const { articles, folders } = await getFolderContentsByPath([], OP);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href="/operator/new-folder"
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          New folder
        </Link>
        <Link
          href="/operator/new-article"
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          New article
        </Link>
      </div>

      <h1 className="mb-2 text-4xl tracking-tight text-foreground">
        Archive
      </h1>
      <p className="mb-10 text-muted">
        Browse folders and articles (uncached).
      </p>
      {folders.length > 0 ? (
        <>
          <h2 className="px-8 text-xs font-semibold uppercase tracking-wider text-muted">
            Folders
          </h2>
          <OperatorFolderGrid
            items={folders.map((folder) => ({
              childCount: folder.childCount,
              href: `${BASE}${routeForPath(folder.pathSegments)}`,
              kind: "folder" as const,
              name: folder.name,
              pathSegments: folder.pathSegments,
            }))}
          />
        </>
      ) : null}
      {articles.length > 0 ? (
        <>
          <h2 className="px-8 pt-6 text-xs font-semibold uppercase tracking-wider text-muted">
            Articles
          </h2>
          <OperatorFileGrid
            items={articles.map((article) => ({
              href: `${BASE}${routeForPath(article.pathSegments)}`,
              name: article.name,
              pathSegments: article.pathSegments,
            }))}
          />
        </>
      ) : null}
      {folders.length === 0 && articles.length === 0 ? (
        <p className="text-muted">No folders or articles found yet.</p>
      ) : null}
    </main>
  );
}
