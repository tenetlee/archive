import { getCategories, getCourses, categorySlug } from "@/lib/github";
import { Header } from "./components/header";
import { FolderGrid } from "./components/folder-grid";

export default async function Home() {
  const categories = await getCategories();

  const items = await Promise.all(
    categories.map(async (cat) => {
      const courses = await getCourses(cat.name);
      return {
        name: cat.name,
        href: `/${categorySlug(cat.name)}`,
        childCount: courses.length,
      };
    })
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl tracking-tight text-foreground">
          Courses
        </h1>
        <p className="mb-10 text-muted">
          Select a category to explore available courses.
        </p>
        <FolderGrid items={items} />
      </main>
    </div>
  );
}
