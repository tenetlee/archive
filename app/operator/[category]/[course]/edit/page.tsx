import { notFound } from "next/navigation";
import { buildArticleDraft } from "@/lib/article-draft";
import {
  getCategoryByRouteValue,
  getCourseByRouteValue,
} from "@/lib/github";
import {
  getOperatorArticleDraft,
  operatorArticlePreviewBaseUrl,
} from "@/lib/operator-content";
import { OperatorArticleEditor } from "../../../OperatorArticleEditor";

const OP = { noCache: true as const };

interface Props {
  params: Promise<{ category: string; course: string }>;
}

export default async function OperatorEditArticlePage({ params }: Props) {
  const { category, course } = await params;
  const categoryEntry = await getCategoryByRouteValue(category, OP);

  if (!categoryEntry) {
    notFound();
  }

  const courseEntry = await getCourseByRouteValue(categoryEntry.name, course, OP);

  if (!courseEntry) {
    notFound();
  }

  const draft = await getOperatorArticleDraft(categoryEntry.name, courseEntry.name);

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-6">
      <OperatorArticleEditor
        category={categoryEntry.name}
        course={courseEntry.name}
        initialRaw={
          draft?.raw ??
          buildArticleDraft({
            title: courseEntry.name,
          })
        }
        initialSha={draft?.sha}
        previewBaseUrl={operatorArticlePreviewBaseUrl(
          categoryEntry.name,
          courseEntry.name
        )}
      />
    </main>
  );
}
