import {
  categorySlug,
  courseSlug,
  getCategoryByRouteValue,
  getCourses,
} from "@/lib/github";
import { Header } from "../components/header";
import { FolderGrid } from "../components/folder-grid";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const categoryEntry = await getCategoryByRouteValue(category);

  if (!categoryEntry) {
    notFound();
  }

  const courses = await getCourses(categoryEntry.name);

  const items = courses.map((course) => ({
    name: course.name,
    href: `/${categorySlug(categoryEntry.name)}/${courseSlug(course.name)}`,
    childCount: 1,
  }));

  const breadcrumbs = [{ label: categoryEntry.name }];

  return (
    <div className="min-h-screen bg-background">
      <Header breadcrumbs={breadcrumbs} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl tracking-tight text-foreground">
          {categoryEntry.name}
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
