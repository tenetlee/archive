import "server-only";

import { buildArticleDraft, parseArticleDraft } from "./article-draft";
import { requireOperatorAuthentication } from "./operator-auth";
import {
  getThemeImageVariant,
  parseThemeImageName,
  stripThemeImageSuffix,
} from "./theme-images";

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

export interface OperatorImageAsset {
  darkFilename?: string;
  darkSha?: string;
  darkUrl?: string;
  displayName: string;
  filename: string;
  markdownPath: string;
  sha: string;
  themeManaged: boolean;
  url: string;
}

interface OperatorDirectoryEntry {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
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

async function getDirectoryEntries(...segments: string[]) {
  const response = await fetch(contentsUrl(...segments), {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}.`);
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as OperatorDirectoryEntry[]) : [];
}

async function putContent({
  encodedContent,
  message,
  pathSegments,
  sha,
}: {
  encodedContent: string;
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
      content: encodedContent,
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

async function deleteContent({
  allowMissing = false,
  message,
  pathSegments,
  sha,
}: {
  allowMissing?: boolean;
  message: string;
  pathSegments: string[];
  sha: string;
}) {
  requireWriteToken();

  const response = await fetch(contentsUrl(...pathSegments), {
    method: "DELETE",
    headers: githubHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      message,
      sha,
    }),
  });

  if (allowMissing && response.status === 404) {
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `GitHub delete failed with status ${response.status}: ${errorText}`
    );
  }
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

export async function getOperatorImageAssets(
  category: string,
  course: string
): Promise<OperatorImageAsset[]> {
  const entries = await getDirectoryEntries(category, course, "images");
  const imageEntries = entries
    .filter(
      (entry) =>
        entry.type === "file" &&
        /\.(png|jpe?g|gif|webp|svg)$/i.test(entry.name)
    )
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const entryMap = new Map(
    imageEntries.map((entry) => [entry.name as string, entry])
  );

  const assets: OperatorImageAsset[] = [];

  for (const entry of imageEntries) {
    const filename = entry.name as string;
    const parsed = parseThemeImageName(filename);

    if (parsed?.mode === "dark") {
      const lightFilename = getThemeImageVariant(filename, "light");
      if (entryMap.has(lightFilename)) {
        continue;
      }
    }

    if (parsed?.mode === "light") {
      const darkFilename = getThemeImageVariant(filename, "dark");
      const darkEntry = entryMap.get(darkFilename);

      if (darkEntry) {
        assets.push({
          darkFilename,
          darkSha: darkEntry.sha as string,
          darkUrl: rawUrl(category, course, "images", darkFilename),
          displayName: stripThemeImageSuffix(filename),
          filename,
          markdownPath: `images/${filename}`,
          sha: entry.sha as string,
          themeManaged: true,
          url: rawUrl(category, course, "images", filename),
        });
        continue;
      }
    }

    assets.push({
      displayName: filename,
      filename,
      markdownPath: `images/${filename}`,
      sha: entry.sha as string,
      themeManaged: false,
      url: rawUrl(category, course, "images", filename),
    });
  }

  return assets;
}

export async function createOperatorCategory(name: string) {
  await requireOperatorAuthentication();
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Category name is required.");
  }

  const existing = await pathExists(trimmedName);
  if (existing) {
    throw new Error("A category with that name already exists.");
  }

  await putContent({
    encodedContent: Buffer.from("Created by operator UI.\n", "utf8").toString(
      "base64"
    ),
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
  await requireOperatorAuthentication();
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
    encodedContent: Buffer.from(raw, "utf8").toString("base64"),
    message: `Create course ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, "notes.md"],
  });
}

async function deleteTree(
  pathSegments: string[],
  label: string
) {
  const entries = await getDirectoryEntries(...pathSegments);
  const directories = entries
    .filter((entry) => entry.type === "dir")
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const files = entries
    .filter((entry) => entry.type === "file")
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const directory of directories) {
    await deleteTree([...pathSegments, directory.name], label);
  }

  for (const file of files) {
    await deleteContent({
      allowMissing: true,
      message: `Delete ${file.name} from ${label}`,
      pathSegments: [...pathSegments, file.name],
      sha: file.sha,
    });
  }
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
  await requireOperatorAuthentication();
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
    encodedContent: Buffer.from(
      trimmedRaw.endsWith("\n") ? trimmedRaw : `${trimmedRaw}\n`,
      "utf8"
    ).toString("base64"),
    message: `Update article ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, "notes.md"],
    sha,
  });

  return {
    sha: result.sha,
    title: parsed.title,
  };
}

export async function deleteOperatorCategory(category: string) {
  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    throw new Error("Category name is required.");
  }

  await deleteTree([trimmedCategory], `category ${trimmedCategory}`);
}

export async function deleteOperatorCourse({
  category,
  course,
}: {
  category: string;
  course: string;
}) {
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();

  if (!trimmedCategory || !trimmedCourse) {
    throw new Error("Category and course are required.");
  }

  await deleteTree(
    [trimmedCategory, trimmedCourse],
    `course ${trimmedCourse} in ${trimmedCategory}`
  );
}

function sanitizeAssetSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function parsePngDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Drawing must be exported as a PNG image.");
  }

  return match[1];
}

export async function createOperatorDrawingAsset({
  category,
  course,
  darkDataUrl,
  lightDataUrl,
  name,
}: {
  category: string;
  course: string;
  darkDataUrl: string;
  lightDataUrl: string;
  name?: string;
}) {
  await requireOperatorAuthentication();
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();

  if (!trimmedCategory || !trimmedCourse) {
    throw new Error("Category and course are required.");
  }

  const encodedLightContent = parsePngDataUrl(lightDataUrl);
  const encodedDarkContent = parsePngDataUrl(darkDataUrl);
  const baseName = sanitizeAssetSegment(name || "drawing") || "drawing";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sharedName = `${baseName}-${stamp}`;
  const lightFilename = `${sharedName}-light.png`;
  const darkFilename = `${sharedName}-dark.png`;

  const lightResult = await putContent({
    encodedContent: encodedLightContent,
    message: `Add drawing ${lightFilename} to ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, "images", lightFilename],
  });

  let darkResult: Awaited<ReturnType<typeof putContent>>;

  try {
    darkResult = await putContent({
      encodedContent: encodedDarkContent,
      message: `Add drawing ${darkFilename} to ${trimmedCourse} in ${trimmedCategory}`,
      pathSegments: [trimmedCategory, trimmedCourse, "images", darkFilename],
    });
  } catch (error) {
    if (lightResult.sha) {
      try {
        await deleteContent({
          message: `Rollback drawing ${lightFilename} in ${trimmedCourse} after dark variant save failed`,
          pathSegments: [trimmedCategory, trimmedCourse, "images", lightFilename],
          sha: lightResult.sha,
        });
      } catch {
        // Keep the original write error; rollback is best-effort.
      }
    }

    throw error;
  }

  return {
    darkFilename,
    darkSha: darkResult.sha ?? "",
    darkUrl: rawUrl(trimmedCategory, trimmedCourse, "images", darkFilename),
    displayName: `${sharedName}.png`,
    filename: lightFilename,
    markdownPath: `images/${lightFilename}`,
    sha: lightResult.sha ?? "",
    themeManaged: true,
    url: rawUrl(trimmedCategory, trimmedCourse, "images", lightFilename),
  };
}

export async function deleteOperatorImageAsset({
  category,
  course,
  darkFilename,
  darkSha,
  filename,
  sha,
}: {
  category: string;
  course: string;
  darkFilename?: string;
  darkSha?: string;
  filename: string;
  sha: string;
}) {
  await requireOperatorAuthentication();
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();
  const trimmedFilename = filename.trim();

  if (!trimmedCategory || !trimmedCourse || !trimmedFilename || !sha) {
    throw new Error("Category, course, filename, and sha are required.");
  }

  if (darkFilename?.trim() && darkSha) {
    await deleteContent({
      allowMissing: true,
      message: `Delete image ${darkFilename.trim()} from ${trimmedCourse} in ${trimmedCategory}`,
      pathSegments: [
        trimmedCategory,
        trimmedCourse,
        "images",
        darkFilename.trim(),
      ],
      sha: darkSha,
    });
  }

  await deleteContent({
    allowMissing: true,
    message: `Delete image ${trimmedFilename} from ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, "images", trimmedFilename],
    sha,
  });
}
