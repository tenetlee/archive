import {
  normalizePrerequisitePath,
  parseArticleDraft,
} from "./article-draft";

const REPO_OWNER = "tenetlee";
const REPO_NAME = "archive-legacy";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;
const REVALIDATE = 3600;
const collator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

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

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function repoPath(...segments: string[]): string {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

function contentsUrl(...segments: string[]): string {
  const path = segments.length > 0 ? `/${repoPath(...segments)}` : "";
  return `${API_BASE}/contents${path}`;
}

function rawUrl(...segments: string[]): string {
  const path = segments.length > 0 ? `/${repoPath(...segments)}` : "";
  return `${RAW_BASE}${path}`;
}

function visibleDirectories(entries: GitHubEntry[]): GitHubEntry[] {
  return entries
    .filter((entry) => entry.type === "dir" && !entry.name.startsWith("."))
    .sort((a, b) => collator.compare(a.name, b.name));
}

function routeValueMatches(name: string, value: string): boolean {
  const decoded = safeDecode(value);
  const slug = categorySlug(name);
  return name === value || name === decoded || slug === value || slug === decoded;
}

export async function getCategories(
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  const res = await fetch(contentsUrl(), {
    headers: headers(),
    ...fetchOptions(opts),
  });

  if (!res.ok) return [];

  const data: GitHubEntry[] = await res.json();
  return visibleDirectories(data);
}

export async function getCourses(
  category: string,
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  const res = await fetch(contentsUrl(category), {
    headers: headers(),
    ...fetchOptions(opts),
  });

  if (!res.ok) return [];

  const data: GitHubEntry[] = await res.json();
  return visibleDirectories(data);
}

export async function getCategoryByRouteValue(
  value: string,
  opts?: FetchOptions
): Promise<GitHubEntry | null> {
  const categories = await getCategories(opts);
  return categories.find((category) => routeValueMatches(category.name, value)) ?? null;
}

export async function getCourseByRouteValue(
  category: string,
  value: string,
  opts?: FetchOptions
): Promise<GitHubEntry | null> {
  const courses = await getCourses(category, opts);
  return courses.find((course) => routeValueMatches(course.name, value)) ?? null;
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
  const res = await fetch(contentsUrl(category, course, "notes.md"), {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.v3.raw",
    },
    ...fetchOptions(opts),
  });

  if (!res.ok) return null;

  const raw = await res.text();
  const parsed = parseArticleDraft(raw, course);
  const rawPath = rawUrl(category, course);

  return {
    content: parsed.content,
    prerequisites: parsed.prerequisites,
    rawPath,
    title: parsed.title,
  };
}

export async function getArticleTitle(
  filepath: string,
  opts?: FetchOptions
): Promise<string> {
  const normalizedPath = normalizePrerequisitePath(filepath);
  const parts = normalizedPath.split("/");
  const folderName = parts.length >= 2 ? parts[parts.length - 1] : parts[0];

  const res = await fetch(contentsUrl(...parts, "notes.md"), {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.v3.raw",
    },
    ...fetchOptions(opts),
  });

  if (!res.ok) return folderName;

  const raw = await res.text();
  return parseArticleDraft(raw, folderName).title;
}

export function courseSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function categorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function prerequisiteToRoute(filepath: string): string {
  const parts = normalizePrerequisitePath(filepath).split("/");
  if (parts.length >= 2) {
    return `/${categorySlug(parts[0])}/${courseSlug(parts[1])}`;
  }
  return `/${categorySlug(parts[0])}`;
}
