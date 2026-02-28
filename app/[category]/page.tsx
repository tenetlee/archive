import { getCourses, courseSlug } from "@/lib/github";
import { Header } from "../components/header";
import { FolderGrid } from "../components/folder-grid";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const decodedCategory = decodeURIComponent(category);
  const courses = await getCourses(decodedCategory);

  const items = courses.map((course) => ({
    name: course.name,
    href: `/${encodeURIComponent(decodedCategory)}/${courseSlug(course.name)}`,
    childCount: 1,
  }));

  const breadcrumbs = [{ label: decodedCategory }];

  return (
    <div className="min-h-screen bg-background">
      <Header breadcrumbs={breadcrumbs} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl tracking-tight text-foreground">
          {decodedCategory}
        </h1>
        <p className="mb-10 text-muted">
          {courses.length} course{courses.length !== 1 ? "s" : ""} available
        </p>
        {items.length > 0 ? (
          <FolderGrid items={items} />
        ) : (
          <p className="text-muted">No courses found in this category yet.</p>
        )}
      </main>
    </div>
  );
}
