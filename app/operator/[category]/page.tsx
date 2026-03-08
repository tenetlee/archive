import {
  categorySlug,
  courseSlug,
  getCategoryByRouteValue,
  getCourses,
} from "@/lib/github";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OperatorFolderGrid } from "../OperatorFolderGrid";

const OP = { noCache: true as const };
const BASE = "/operator";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function OperatorCategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryEntry = await getCategoryByRouteValue(category, OP);

  if (!categoryEntry) {
    notFound();
  }

  const courses = await getCourses(categoryEntry.name, OP);

  const items = courses.map((course) => ({
    category: categoryEntry.name,
    course: course.name,
    name: course.name,
    href: `${BASE}/${categorySlug(categoryEntry.name)}/${courseSlug(course.name)}`,
    childCount: 1,
    kind: "course" as const,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={`/operator/new-course?category=${encodeURIComponent(
            categoryEntry.name
          )}`}
          className="border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
        >
          New course
        </Link>
      </div>

      <h1 className="mb-2 text-4xl tracking-tight text-foreground">
        {categoryEntry.name}
      </h1>
      <p className="mb-10 text-muted">
        {courses.length} course{courses.length !== 1 ? "s" : ""} available
        (uncached)
      </p>
      {items.length > 0 ? (
        <OperatorFolderGrid items={items} />
      ) : (
        <p className="text-muted">No courses found in this category yet.</p>
      )}
    </main>
  );
}
