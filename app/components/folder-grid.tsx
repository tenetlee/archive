"use client";

import { FolderCard } from "./folder-card";

interface FolderItem {
  name: string;
  href: string;
  childCount?: number;
}

export function FolderGrid({ items }: { items: FolderItem[] }) {
  return (
    <div className="flex flex-wrap gap-8 p-8">
      {items.map((item) => (
        <FolderCard
          key={item.name}
          label={item.name}
          href={item.href}
          childCount={item.childCount}
        />
      ))}
    </div>
  );
}
