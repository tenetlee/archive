import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticleByPath,
  getFolderContentsByPath,
  resolveContentPath,
  routeForPath,
} from "@/lib/github";
import {
  getOperatorArticleDraftByPath,
  getOperatorImageAssetsByPath,
  operatorArticlePreviewBaseUrlByPath,
} from "@/lib/operator-content";
import { buildArticleDraft } from "@/lib/article-draft";
import { ArticleContent } from "../../components/article-content";
import { PrerequisitesSidebar } from "../../components/prerequisites-sidebar";
import { OperatorArticleEditor } from "../OperatorArticleEditor";
import { OperatorFileGrid } from "../OperatorFileGrid";
import { OperatorFolderGrid } from "../OperatorFolderGrid";
import { OperatorRenameFolderButton } from "../OperatorRenameFolderButton";

const OP = { noCache: true as const };
const BASE = "/operator";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function OperatorContentPathPage({ params }: Props) {
  const { slug } = await params;
  const fullResolved = await resolveContentPath(slug, OP);
  const isEditRoute = slug[slug.length - 1] === "edit" && !fullResolved;
  const contentSlug = isEditRoute ? slug.slice(0, -1) : slug;
  const resolved = isEditRoute ? await resolveContentPath(contentSlug, OP) : fullResolved;

  if (!resolved) {
    notFound();
  }

  if (isEditRoute) {
    const draft = await getOperatorArticleDraftByPath(resolved.actualSegments);
    if (!draft) {
      notFound();
    }

    const assets = await getOperatorImageAssetsByPath(resolved.actualSegments);

    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
        <OperatorArticleEditor
          articlePath={resolved.actualSegments}
          initialAssets={assets}
          initialRaw={
            draft.raw ??
            buildArticleDraft({
              title:
                resolved.actualSegments[resolved.actualSegments.length - 1] ??
                "Untitled",
            })
          }
          initialSha={draft.sha}
          previewBaseUrl={operatorArticlePreviewBaseUrlByPath(
            resolved.actualSegments
          )}
        />
      </main>
    );
  }

  const article = await getArticleByPath(resolved.actualSegments, OP);

  if (article) {
    return (
      <div>
        <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-8 py-6 lg:px-12">
          <Link
            href={`${BASE}${routeForPath(resolved.actualSegments)}/edit`}
            className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            Edit article
          </Link>
          <Link
            href={routeForPath(resolved.actualSegments)}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
          >
            Open public page
          </Link>
        </div>

        <div className="mx-auto flex max-w-7xl gap-0">
          <aside className="hidden w-52 shrink-0 border-r border-border px-4 pt-8 lg:block">
            <ArticleContent content={article.content} mode="toc" />
          </aside>

          <main className="min-w-0 flex-1 px-8 py-8 lg:px-12">
            <ArticleContent
              content={article.content}
              imageBaseUrl={article.rawPath}
              mode="content"
              title={article.title}
            />
          </main>

          <aside className="hidden w-60 shrink-0 border-l border-border px-4 pt-8 xl:block">
            <PrerequisitesSidebar
              prerequisites={article.prerequisites}
              noCache
              basePath="/operator"
            />
          </aside>
        </div>
      </div>
    );
  }

  const { articles, folders } = await getFolderContentsByPath(resolved.actualSegments, OP);
  const parentQuery = encodeURIComponent(resolved.actualSegments.join("/"));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={`/operator/new-folder?parent=${parentQuery}`}
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          New folder
        </Link>
        <Link
          href={`/operator/new-article?parent=${parentQuery}`}
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          New article
        </Link>
        <Link
          href={routeForPath(resolved.actualSegments)}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          Open public folder
        </Link>
      </div>

      <div className="mb-2 flex items-center gap-3">
        <h1 className="text-4xl tracking-tight text-foreground">
          {resolved.actualSegments[resolved.actualSegments.length - 1]}
        </h1>
        <OperatorRenameFolderButton pathSegments={resolved.actualSegments} />
      </div>
      <p className="mb-10 text-muted">
        {folders.length} folder{folders.length !== 1 ? "s" : ""} and{" "}
        {articles.length} article{articles.length !== 1 ? "s" : ""} available
        (uncached)
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
            items={articles.map((entry) => ({
              href: `${BASE}${routeForPath(entry.pathSegments)}`,
              name: entry.name,
              pathSegments: entry.pathSegments,
            }))}
          />
        </>
      ) : null}

      {folders.length === 0 && articles.length === 0 ? (
        <p className="text-muted">This folder is empty.</p>
      ) : null}
    </main>
  );
}
