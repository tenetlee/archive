import { getCategories, getCourses, categorySlug } from "@/lib/github";
import { FolderGrid } from "../components/folder-grid";

const OP = { noCache: true as const };
const BASE = "/operator";

export default async function OperatorHome() {
  const categories = await getCategories(OP);

  const items = await Promise.all(
    categories.map(async (cat) => {
      const courses = await getCourses(cat.name, OP);
      return {
        name: cat.name,
        href: `${BASE}/${categorySlug(cat.name)}`,
        childCount: courses.length,
      };
    })
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-2 text-4xl tracking-tight text-foreground">
        Courses
      </h1>
      <p className="mb-10 text-muted">
        Select a category (uncached — fresh from GitHub).
      </p>
      <FolderGrid items={items} />
    </main>
  );
}
