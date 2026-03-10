import { getFolderContentsByPath } from "@/lib/github";
import { Header } from "./components/header";
import { FileGrid } from "./components/file-grid";
import { FolderGrid } from "./components/folder-grid";

export default async function Home() {
  const { articles, folders } = await getFolderContentsByPath([]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl tracking-tight text-foreground">
          Archive
        </h1>
        <p className="mb-10 text-muted">
          Browse folders and articles.
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
          <p className="text-muted">No folders or articles found yet.</p>
        ) : null}
      </main>
    </div>
  );
}
