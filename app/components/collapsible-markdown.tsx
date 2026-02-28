"use client";

import { MarkdownRenderer } from "./markdown-renderer";

interface Section {
  level: number;
  title: string;
  id: string;
  body: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function parseSections(content: string): { intro: string; sections: Section[] } {
  const sections: Section[] = [];
  const parts = content.split(/\n(?=#{2,6}\s)/m);
  let intro = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    const firstLineMatch = part.match(/^(#{2,6})\s+(.+)$/m);
    if (firstLineMatch) {
      const level = firstLineMatch[1].length;
      const title = firstLineMatch[2].trim();
      const bodyStart = part.indexOf("\n");
      const body = bodyStart >= 0 ? part.slice(bodyStart + 1).trim() : "";
      sections.push({
        level,
        title,
        id: slugify(title),
        body,
      });
    } else {
      intro = part;
    }
  }

  return { intro, sections };
}

const headingClasses: Record<number, string> = {
  2: "mb-4 mt-8 text-3xl font-normal leading-snug text-foreground",
  3: "mb-3 mt-6 text-2xl font-normal leading-snug text-foreground",
  4: "mb-2 mt-5 text-xl font-normal text-foreground",
  5: "mb-2 mt-4 text-lg font-normal text-foreground",
  6: "mb-2 mt-4 text-base font-normal text-muted",
};

interface CollapsibleMarkdownProps {
  content: string;
  imageBaseUrl: string;
}

export function CollapsibleMarkdown({
  content,
  imageBaseUrl,
}: CollapsibleMarkdownProps) {
  const { intro, sections } = parseSections(content);

  return (
    <div className="prose-archive max-w-none space-y-4">
      {intro ? (
        <MarkdownRenderer content={intro} imageBaseUrl={imageBaseUrl} />
      ) : null}
      {sections.map((section) => {
        const Tag = `h${section.level}` as "h2" | "h3" | "h4" | "h5" | "h6";
        return (
          <details
            key={section.id}
            className="group border border-border bg-surface"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 px-4 transition-colors hover:bg-surface-alt [&::-webkit-details-marker]:hidden">
              <span
                className="inline-block shrink-0 text-muted transition-transform group-open:rotate-90"
                aria-hidden
              >
                ▶
              </span>
              <Tag
                id={section.id}
                className={`mb-0 mt-0 flex-1 ${headingClasses[section.level]}`}
                style={{ fontFamily: "var(--font-subtitle)" }}
              >
                {section.title}
              </Tag>
            </summary>
            <div className="border-t border-border px-4 pb-4 pt-2">
              {section.body ? (
                <MarkdownRenderer
                  content={section.body}
                  imageBaseUrl={imageBaseUrl}
                />
              ) : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}
