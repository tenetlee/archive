import { buildArticleDraft, parseArticleDraft } from "./article-draft";

const REPO_OWNER = "tenetlee";
const REPO_NAME = "archive-legacy";
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main`;

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

function githubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function requireWriteToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "Set GITHUB_TOKEN with repository write access to use the operator editor."
    );
  }
  return token;
}

async function pathExists(...segments: string[]) {
  const response = await fetch(contentsUrl(...segments), {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  return true;
}

async function getFileContentEntry(...segments: string[]) {
  const response = await fetch(contentsUrl(...segments), {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  const data = await response.json();
  return Array.isArray(data) ? null : data;
}

async function putContent({
  content,
  message,
  pathSegments,
  sha,
}: {
  content: string;
  message: string;
  pathSegments: string[];
  sha?: string;
}) {
  requireWriteToken();

  const response = await fetch(contentsUrl(...pathSegments), {
    method: "PUT",
    headers: githubHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      content: Buffer.from(content, "utf8").toString("base64"),
      message,
      sha,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub write failed with status ${response.status}: ${errorText}`
    );
  }

  const data = await response.json();
  return {
    sha: data.content?.sha as string | undefined,
  };
}

export function operatorArticlePreviewBaseUrl(category: string, course: string) {
  return rawUrl(category, course);
}

export async function getOperatorArticleDraft(category: string, course: string) {
  const entry = await getFileContentEntry(category, course, "notes.md");
  if (!entry?.content || !entry.sha) {
    return null;
  }

  const raw = Buffer.from(entry.content, "base64").toString("utf8");
  return {
    parsed: parseArticleDraft(raw, course),
    raw,
    sha: entry.sha as string,
  };
}

export async function createOperatorCategory(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  const existing = await pathExists(trimmedName);
  if (existing) {
    throw new Error("A category with that name already exists.");
  }

  await putContent({
    content: "Created by operator UI.\n",
    message: `Create category ${trimmedName}`,
    pathSegments: [trimmedName, ".gitkeep"],
  });
}

export async function createOperatorCourse({
  category,
  content,
  course,
  prerequisites,
  title,
}: {
  category: string;
  content?: string;
  course: string;
  prerequisites?: string[];
  title?: string;
}) {
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();

  if (!trimmedCategory) {
    throw new Error("Category is required.");
  }

  if (!trimmedCourse) {
    throw new Error("Course name is required.");
  }

  const categoryEntry = await pathExists(trimmedCategory);
  if (!categoryEntry) {
    throw new Error("Selected category does not exist.");
  }

  const existing = await pathExists(trimmedCategory, trimmedCourse, "notes.md");
  if (existing) {
    throw new Error("A course with that name already exists in this category.");
  }

  const raw = buildArticleDraft({
    content,
    prerequisites,
    title: title?.trim() || trimmedCourse,
  });

  await putContent({
    content: raw,
    message: `Create course ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, "notes.md"],
  });
}

export async function saveOperatorArticle({
  category,
  course,
  raw,
  sha,
}: {
  category: string;
  course: string;
  raw: string;
  sha?: string;
}) {
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();
  const trimmedRaw = raw.replace(/\r\n/g, "\n");

  if (!trimmedCategory || !trimmedCourse) {
    throw new Error("Category and course are required.");
  }

  if (!trimmedRaw.trim()) {
    throw new Error("Article content cannot be empty.");
  }

  const parsed = parseArticleDraft(trimmedRaw, trimmedCourse);
  if (!parsed.title.trim()) {
    throw new Error("Article title cannot be empty.");
  }

  const result = await putContent({
    content: trimmedRaw.endsWith("\n") ? trimmedRaw : `${trimmedRaw}\n`,
    message: `Update article ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, "notes.md"],
    sha,
  });

  return {
    sha: result.sha,
    title: parsed.title,
  };
}
