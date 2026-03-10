import { OperatorCreateFolderForm } from "../OperatorCreateFolderForm";

interface Props {
  searchParams: Promise<{ parent?: string }>;
}

export default async function OperatorNewFolderPage({ searchParams }: Props) {
  const params = await searchParams;
  const parentPath = (params.parent ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const parentLabel = parentPath.length > 0 ? parentPath.join(" / ") : "Root";

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <OperatorCreateFolderForm
        parentLabel={parentLabel}
        parentPath={parentPath}
      />
    </main>
  );
}
