import { getCategories, getCategoryByRouteValue } from "@/lib/github";
import { OperatorCreateCourseForm } from "../OperatorCreateCourseForm";

const OP = { noCache: true as const };

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function OperatorNewCoursePage({ searchParams }: Props) {
  const params = await searchParams;
  const categories = await getCategories(OP);
  const resolvedCategory = params.category
    ? await getCategoryByRouteValue(params.category, OP)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <OperatorCreateCourseForm
        categories={categories.map((category) => category.name)}
        initialCategory={resolvedCategory?.name}
      />
    </main>
  );
}
