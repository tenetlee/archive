const REPO_OWNER = "tenetlee";
const REPO_NAME = "archive-legacy";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;

function headers(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  const h: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

const REVALIDATE = 3600;

export type FetchOptions = { noCache?: boolean };

function fetchOptions(opts?: FetchOptions): RequestInit {
  if (opts?.noCache) {
    return { cache: "no-store" as RequestCache };
  }
  return { next: { revalidate: REVALIDATE } };
}

export interface GitHubEntry {
  name: string;
  path: string;
  type: "file" | "dir";
}

export async function getCategories(
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  const res = await fetch(`${API_BASE}/contents/`, {
    headers: headers(),
    ...fetchOptions(opts),
  });

  if (!res.ok) return [];

  const data: GitHubEntry[] = await res.json();
  return data.filter((e) => e.type === "dir");
}

export async function getCourses(
  category: string,
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  const res = await fetch(
    `${API_BASE}/contents/${encodeURIComponent(category)}`,
    {
      headers: headers(),
      ...fetchOptions(opts),
    }
  );

  if (!res.ok) return [];

  const data: GitHubEntry[] = await res.json();
  return data.filter((e) => e.type === "dir");
}

export interface Article {
  title: string;
  prerequisites: string[];
  content: string;
  rawPath: string;
}

export async function getArticle(
  category: string,
  course: string,
  opts?: FetchOptions
): Promise<Article | null> {
  const filePath = `${category}/${course}/notes.md`;
  const res = await fetch(`${API_BASE}/contents/${encodeURI(filePath)}`, {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.v3.raw",
    },
    ...fetchOptions(opts),
  });

  if (!res.ok) return null;

  const raw = await res.text();
  const lines = raw.split("\n");

  let title = course;
  let prerequisites: string[] = [];
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#") && !title) {
      title = line.replace(/^#+\s*/, "");
      contentStart = i + 1;
      continue;
    }

    if (line.startsWith("#")) {
      title = line.replace(/^#+\s*/, "");
      contentStart = i + 1;
      continue;
    }

    if (line.toLowerCase().startsWith("prerequisites:")) {
      const paths = line.replace(/^prerequisites:\s*/i, "");
      prerequisites = paths
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      contentStart = i + 1;
      continue;
    }

    if (line.trim() === "" && i <= contentStart) {
      contentStart = i + 1;
      continue;
    }

    break;
  }

  const content = lines.slice(contentStart).join("\n");
  const rawPath = `${RAW_BASE}/${category}/${course}`;

  return { title, prerequisites, content, rawPath };
}

export async function getArticleTitle(
  filepath: string,
  opts?: FetchOptions
): Promise<string> {
  const parts = filepath.replace(/^\//, "").split("/");
  const folderName = parts.length >= 2 ? parts[parts.length - 2] : parts[0];

  const fullPath = filepath.endsWith("notes.md")
    ? filepath
    : `${filepath}/notes.md`;

  const res = await fetch(`${API_BASE}/contents/${encodeURI(fullPath)}`, {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.v3.raw",
    },
    ...fetchOptions(opts),
  });

  if (!res.ok) return folderName;

  const raw = await res.text();
  const firstLine = raw.split("\n").find((l) => l.startsWith("#"));
  if (firstLine) {
    return firstLine.replace(/^#+\s*/, "");
  }

  return folderName;
}

export function resolveImageUrl(
  src: string,
  category: string,
  course: string
): string {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  return `${RAW_BASE}/${category}/${course}/${src}`;
}

export function courseSlug(name: string): string {
  return encodeURIComponent(name);
}

export function categorySlug(name: string): string {
  return encodeURIComponent(name);
}

export function prerequisiteToRoute(filepath: string): string {
  const clean = filepath.replace(/^\//, "").replace(/\/notes\.md$/, "");
  const parts = clean.split("/");
  if (parts.length >= 2) {
    return `/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}`;
  }
  return `/${encodeURIComponent(parts[0])}`;
}
