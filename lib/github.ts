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

export interface ResolvedContentPath {
  actualSegments: string[];
  slugSegments: string[];
}

export interface FolderListingItem {
  childCount: number;
  href: string;
  kind: "folder" | "article";
  name: string;
  pathSegments: string[];
}

export interface FolderContents {
  articles: FolderListingItem[];
  folders: FolderListingItem[];
  hasArticle: boolean;
}

export interface Article {
  content: string;
  prerequisites: string[];
  rawPath: string;
  title: string;
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

async function getDirectoryContents(
  segments: string[],
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  const res = await fetch(contentsUrl(...segments), {
    headers: headers(),
    ...fetchOptions(opts),
  });

  if (!res.ok) {
    return [];
  }

  return (await res.json()) as GitHubEntry[];
}

function routeValueMatches(name: string, value: string): boolean {
  const decoded = safeDecode(value);
  const slug = pathSegmentSlug(name);
  return name === value || name === decoded || slug === value || slug === decoded;
}

function navigableDirectories(entries: GitHubEntry[]) {
  return visibleDirectories(entries).filter((entry) => entry.name !== "images");
}

async function inspectDirectoryKind(
  pathSegments: string[],
  opts?: FetchOptions
): Promise<{ childCount: number; kind: "article" | "folder" }> {
  const entries = await getDirectoryContents(pathSegments, opts);
  const hasArticle = entries.some(
    (entry) => entry.type === "file" && entry.name === "notes.md"
  );

  if (hasArticle) {
    return {
      childCount: 0,
      kind: "article",
    };
  }

  return {
    childCount: navigableDirectories(entries).length,
    kind: "folder",
  };
}

export function pathSegmentSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export const categorySlug = pathSegmentSlug;
export const courseSlug = pathSegmentSlug;
export const articleSlug = pathSegmentSlug;

export function routeForPath(pathSegments: string[]): string {
  if (pathSegments.length === 0) {
    return "/";
  }

  return `/${pathSegments.map(pathSegmentSlug).join("/")}`;
}

export async function getTopLevelEntries(
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  const res = await fetch(contentsUrl(), {
    headers: headers(),
    ...fetchOptions(opts),
  });

  if (!res.ok) {
    return [];
  }

  const data: GitHubEntry[] = await res.json();
  return navigableDirectories(data);
}

export async function resolveContentPath(
  routeSegments: string[],
  opts?: FetchOptions
): Promise<ResolvedContentPath | null> {
  const actualSegments: string[] = [];
  const slugSegments: string[] = [];

  for (const segment of routeSegments) {
    const entries = await getDirectoryContents(actualSegments, opts);
    const match = navigableDirectories(entries).find((entry) =>
      routeValueMatches(entry.name, segment)
    );

    if (!match) {
      return null;
    }

    actualSegments.push(match.name);
    slugSegments.push(pathSegmentSlug(match.name));
  }

  return {
    actualSegments,
    slugSegments,
  };
}

export async function getFolderContentsByPath(
  pathSegments: string[],
  opts?: FetchOptions
): Promise<FolderContents> {
  const entries = await getDirectoryContents(pathSegments, opts);
  const hasArticle = entries.some(
    (entry) => entry.type === "file" && entry.name === "notes.md"
  );
  const directories = navigableDirectories(entries);
  const inspected = await Promise.all(
    directories.map(async (entry) => {
      const nextPathSegments = [...pathSegments, entry.name];
      const detail = await inspectDirectoryKind(nextPathSegments, opts);
      return {
        childCount: detail.childCount,
        href: routeForPath(nextPathSegments),
        kind: detail.kind,
        name: entry.name,
        pathSegments: nextPathSegments,
      } satisfies FolderListingItem;
    })
  );

  return {
    articles: inspected.filter((item) => item.kind === "article"),
    folders: inspected.filter((item) => item.kind === "folder"),
    hasArticle,
  };
}

export async function isArticlePath(
  pathSegments: string[],
  opts?: FetchOptions
): Promise<boolean> {
  const entries = await getDirectoryContents(pathSegments, opts);
  return entries.some((entry) => entry.type === "file" && entry.name === "notes.md");
}

export async function getArticleByPath(
  pathSegments: string[],
  opts?: FetchOptions
): Promise<Article | null> {
  const res = await fetch(contentsUrl(...pathSegments, "notes.md"), {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.v3.raw",
    },
    ...fetchOptions(opts),
  });

  if (!res.ok) {
    return null;
  }

  const raw = await res.text();
  const fallbackTitle = pathSegments[pathSegments.length - 1] ?? "Untitled";
  const parsed = parseArticleDraft(raw, fallbackTitle);

  return {
    content: parsed.content,
    prerequisites: parsed.prerequisites,
    rawPath: rawUrl(...pathSegments),
    title: parsed.title,
  };
}

export async function getArticleTitle(
  filepath: string,
  opts?: FetchOptions
): Promise<string> {
  const normalizedPath = normalizePrerequisitePath(filepath);
  const parts = normalizedPath.split("/");
  const folderName = parts.length > 0 ? parts[parts.length - 1] : "Untitled";

  const res = await fetch(contentsUrl(...parts, "notes.md"), {
    headers: {
      ...headers(),
      Accept: "application/vnd.github.v3.raw",
    },
    ...fetchOptions(opts),
  });

  if (!res.ok) {
    return folderName;
  }

  const raw = await res.text();
  return parseArticleDraft(raw, folderName).title;
}

export function prerequisiteToRoute(filepath: string): string {
  const parts = normalizePrerequisitePath(filepath).split("/");
  return routeForPath(parts);
}

// Legacy wrappers retained so existing callers can be migrated incrementally.
export async function getCategories(opts?: FetchOptions): Promise<GitHubEntry[]> {
  return getTopLevelEntries(opts);
}

export async function getCourses(
  category: string,
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  return navigableDirectories(await getDirectoryContents([category], opts));
}

export async function getArticles(
  category: string,
  course: string,
  opts?: FetchOptions
): Promise<GitHubEntry[]> {
  return navigableDirectories(
    await getDirectoryContents([category, course], opts)
  );
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

export async function getArticleByRouteValue(
  category: string,
  course: string,
  value: string,
  opts?: FetchOptions
): Promise<GitHubEntry | null> {
  const articles = await getArticles(category, course, opts);
  return articles.find((article) => routeValueMatches(article.name, value)) ?? null;
}

export async function hasLegacyCourseArticle(
  category: string,
  course: string,
  opts?: FetchOptions
): Promise<boolean> {
  const entries = await getDirectoryContents([category, course], opts);
  return entries.some((entry) => entry.type === "file" && entry.name === "notes.md");
}

export async function getArticle(
  category: string,
  course: string,
  articleOrOpts?: string | FetchOptions,
  opts?: FetchOptions
): Promise<Article | null> {
  const article =
    typeof articleOrOpts === "string" ? articleOrOpts : undefined;
  const resolvedOpts =
    typeof articleOrOpts === "string" ? opts : articleOrOpts;

  return getArticleByPath(
    article ? [category, course, article] : [category, course],
    resolvedOpts
  );
}
