"use client";

import { FileCard } from "./file-card";

interface FileItem {
  href: string;
  name: string;
}

export function FileGrid({ items }: { items: FileItem[] }) {
  return (
    <div className="flex flex-wrap gap-8 p-8">
      {items.map((item) => (
        <FileCard
          key={item.name}
          href={item.href}
          label={item.name}
        />
      ))}
    </div>
  );
}
