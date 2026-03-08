import {
  categorySlug,
  courseSlug,
  getArticle,
  getCategoryByRouteValue,
  getCourseByRouteValue,
} from "@/lib/github";
import Link from "next/link";
import { ArticleContent } from "../../../components/article-content";
import { PrerequisitesSidebar } from "../../../components/prerequisites-sidebar";
import { notFound } from "next/navigation";

const OP = { noCache: true as const };

interface Props {
  params: Promise<{ category: string; course: string }>;
}

export default async function OperatorCoursePage({ params }: Props) {
  const { category, course } = await params;
  const categoryEntry = await getCategoryByRouteValue(category, OP);

  if (!categoryEntry) {
    notFound();
  }

  const courseEntry = await getCourseByRouteValue(categoryEntry.name, course, OP);

  if (!courseEntry) {
    notFound();
  }

  const article = await getArticle(categoryEntry.name, courseEntry.name, OP);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-3 px-8 py-6 lg:px-12">
        <Link
          href={`/operator/${categorySlug(categoryEntry.name)}/${courseSlug(
            courseEntry.name
          )}/edit`}
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          Edit article
        </Link>
        <Link
          href={`/${categorySlug(categoryEntry.name)}/${courseSlug(
            courseEntry.name
          )}`}
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
          <div className="mt-6">
            <a
              href="https://github.com/tenetlee/archive-legacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Contribute
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
