export interface ParsedArticleDraft {
  content: string;
  prerequisites: string[];
  title: string;
}

export function normalizePrerequisitePath(filepath: string): string {
  return filepath
    .replace(/^\//, "")
    .replace(/\/notes\.md$/i, "")
    .replace(/\/+/g, "/");
}

export function trimBlankEdges(lines: string[]): string {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start]?.trim() === "") {
    start += 1;
  }

  while (end > start && lines[end - 1]?.trim() === "") {
    end -= 1;
  }

  return lines.slice(start, end).join("\n");
}

export function parseArticleDraft(
  raw: string,
  fallbackTitle: string
): ParsedArticleDraft {
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/);
  let cursor = 0;
  let title = fallbackTitle;
  const prerequisites: string[] = [];
  const seen = new Set<string>();

  while (cursor < lines.length && lines[cursor]?.trim() === "") {
    cursor += 1;
  }

  const titleMatch = lines[cursor]?.match(/^#\s+(.+)$/);
  if (titleMatch) {
    title = titleMatch[1].trim();
    cursor += 1;
  }

  while (cursor < lines.length) {
    const line = lines[cursor]?.trim() ?? "";

    if (line === "") {
      cursor += 1;
      continue;
    }

    const prerequisitesMatch = line.match(/^prerequisites:\s*(.*)$/i);
    if (!prerequisitesMatch) {
      break;
    }

    for (const item of prerequisitesMatch[1].split(",")) {
      const normalized = normalizePrerequisitePath(item.trim());
      if (!normalized || seen.has(normalized)) {
        continue;
      }

      prerequisites.push(normalized);
      seen.add(normalized);
    }

    cursor += 1;
  }

  return {
    content: trimBlankEdges(lines.slice(cursor)),
    prerequisites,
    title,
  };
}

export function buildArticleDraft({
  content,
  prerequisites = [],
  title,
}: {
  content?: string;
  prerequisites?: string[];
  title: string;
}): string {
  const normalizedPrerequisites = prerequisites
    .map((item) => normalizePrerequisitePath(item.trim()))
    .filter(Boolean);

  const sections = [`# ${title.trim() || "Untitled"}`];

  if (normalizedPrerequisites.length > 0) {
    sections.push(`Prerequisites: ${normalizedPrerequisites.join(", ")}`);
  }

  sections.push("");

  if (content && content.trim().length > 0) {
    sections.push(trimBlankEdges(content.split(/\r?\n/)));
  } else {
    sections.push("Start writing here.");
  }

  return sections.join("\n");
}
