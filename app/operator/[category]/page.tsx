import { getCourses, courseSlug } from "@/lib/github";
import { FolderGrid } from "../../components/folder-grid";

const OP = { noCache: true as const };
const BASE = "/operator";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function OperatorCategoryPage({ params }: Props) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const courses = await getCourses(decodedCategory, OP);

  const items = courses.map((course) => ({
    name: course.name,
    href: `${BASE}/${encodeURIComponent(decodedCategory)}/${courseSlug(course.name)}`,
    childCount: 1,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl tracking-tight text-foreground">
          {decodedCategory}
        </h1>
        <p className="mb-10 text-muted">
          {courses.length} course{courses.length !== 1 ? "s" : ""} available
          (uncached)
        </p>
        {items.length > 0 ? (
          <FolderGrid items={items} />
        ) : (
          <p className="text-muted">No courses found in this category yet.</p>
        )}
      </main>
  );
}
