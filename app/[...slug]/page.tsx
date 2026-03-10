import { notFound } from "next/navigation";
import {
  getArticleByPath,
  getFolderContentsByPath,
  resolveContentPath,
  routeForPath,
} from "@/lib/github";
import { ArticleContent } from "../components/article-content";
import { FileGrid } from "../components/file-grid";
import { FolderGrid } from "../components/folder-grid";
import { Header } from "../components/header";
import { PrerequisitesSidebar } from "../components/prerequisites-sidebar";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function ContentPathPage({ params }: Props) {
  const { slug } = await params;
  const resolved = await resolveContentPath(slug);

  if (!resolved) {
    notFound();
  }

  const article = await getArticleByPath(resolved.actualSegments);

  if (article) {
    const breadcrumbs = resolved.actualSegments.map((segment, index) => ({
      label: segment,
      href:
        index < resolved.actualSegments.length - 1
          ? routeForPath(resolved.actualSegments.slice(0, index + 1))
          : undefined,
    }));

    return (
      <div className="min-h-screen bg-background">
        <Header breadcrumbs={breadcrumbs} />
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
            <PrerequisitesSidebar prerequisites={article.prerequisites} />
          </aside>
        </div>
      </div>
    );
  }

  const { articles, folders } = await getFolderContentsByPath(resolved.actualSegments);
  const breadcrumbs = resolved.actualSegments.map((segment, index) => ({
    label: segment,
    href:
      index < resolved.actualSegments.length - 1
        ? routeForPath(resolved.actualSegments.slice(0, index + 1))
        : undefined,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header breadcrumbs={breadcrumbs} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl tracking-tight text-foreground">
          {resolved.actualSegments[resolved.actualSegments.length - 1]}
        </h1>
        <p className="mb-10 text-muted">
          {folders.length} folder{folders.length !== 1 ? "s" : ""} and{" "}
          {articles.length} article{articles.length !== 1 ? "s" : ""}.
        </p>
        {folders.length > 0 ? (
          <>
            <h2 className="px-8 text-xs font-semibold uppercase tracking-wider text-muted">
              Folders
            </h2>
            <FolderGrid items={folders} />
          </>
        ) : null}
        {articles.length > 0 ? (
          <>
            <h2 className="px-8 pt-6 text-xs font-semibold uppercase tracking-wider text-muted">
              Articles
            </h2>
            <FileGrid items={articles} />
          </>
        ) : null}
        {folders.length === 0 && articles.length === 0 ? (
          <p className="text-muted">This folder is empty.</p>
        ) : null}
      </main>
    </div>
  );
}
