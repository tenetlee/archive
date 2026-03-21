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
    throw new Error(
      `GitHub write failed (status ${response.status}). Check your token permissions.`
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
    throw new Error(
      `GitHub delete failed (status ${response.status}). Check your token permissions.`
    );
  }
}

export function operatorArticlePreviewBaseUrl(
  category: string,
  course: string,
  article?: string
) {
  return article ? rawUrl(category, course, article) : rawUrl(category, course);
}

export function operatorArticlePreviewBaseUrlByPath(pathSegments: string[]) {
  return rawUrl(...pathSegments);
}

export async function getOperatorArticleDraft(
  category: string,
  course: string,
  article?: string
) {
  const entry = article
    ? await getFileContentEntry(category, course, article, "notes.md")
    : await getFileContentEntry(category, course, "notes.md");
  if (!entry?.content || !entry.sha) {
    return null;
  }

  const raw = Buffer.from(entry.content, "base64").toString("utf8");
  return {
    parsed: parseArticleDraft(raw, article || course),
    raw,
    sha: entry.sha as string,
  };
}

export async function getOperatorArticleDraftByPath(pathSegments: string[]) {
  const entry = await getFileContentEntry(...pathSegments, "notes.md");
  if (!entry?.content || !entry.sha) {
    return null;
  }

  const raw = Buffer.from(entry.content, "base64").toString("utf8");
  const fallbackTitle = pathSegments[pathSegments.length - 1] ?? "Untitled";
  return {
    parsed: parseArticleDraft(raw, fallbackTitle),
    raw,
    sha: entry.sha as string,
  };
}

export async function getOperatorImageAssets(
  category: string,
  course: string,
  article?: string
): Promise<OperatorImageAsset[]> {
  const entries = article
    ? await getDirectoryEntries(category, course, article, "images")
    : await getDirectoryEntries(category, course, "images");
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
          darkUrl: article
            ? rawUrl(category, course, article, "images", darkFilename)
            : rawUrl(category, course, "images", darkFilename),
          displayName: stripThemeImageSuffix(filename),
          filename,
          markdownPath: `images/${filename}`,
          sha: entry.sha as string,
          themeManaged: true,
          url: article
            ? rawUrl(category, course, article, "images", filename)
            : rawUrl(category, course, "images", filename),
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
      url: article
        ? rawUrl(category, course, article, "images", filename)
        : rawUrl(category, course, "images", filename),
    });
  }

  return assets;
}

export async function getOperatorImageAssetsByPath(
  pathSegments: string[]
): Promise<OperatorImageAsset[]> {
  const entries = await getDirectoryEntries(...pathSegments, "images");
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
          darkUrl: rawUrl(...pathSegments, "images", darkFilename),
          displayName: stripThemeImageSuffix(filename),
          filename,
          markdownPath: `images/${filename}`,
          sha: entry.sha as string,
          themeManaged: true,
          url: rawUrl(...pathSegments, "images", filename),
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
      url: rawUrl(...pathSegments, "images", filename),
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

export async function createOperatorFolder({
  name,
  parentPath,
}: {
  name: string;
  parentPath?: string[];
}) {
  await requireOperatorAuthentication();
  const trimmedName = name.trim();
  const normalizedParentPath = (parentPath ?? []).map((segment) => segment.trim()).filter(Boolean);

  if (!trimmedName) {
    throw new Error("Folder name is required.");
  }

  if (await pathExists(...normalizedParentPath, trimmedName)) {
    throw new Error("A folder with that name already exists here.");
  }

  await putContent({
    encodedContent: Buffer.from("Created by operator UI.\n", "utf8").toString(
      "base64"
    ),
    message: `Create folder ${trimmedName}`,
    pathSegments: [...normalizedParentPath, trimmedName, ".gitkeep"],
  });
}

export async function createOperatorCourse({
  category,
  course,
}: {
  category: string;
  course: string;
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

  if (!(await pathExists(trimmedCategory))) {
    throw new Error("Selected category does not exist.");
  }

  const existing = await pathExists(trimmedCategory, trimmedCourse);
  if (existing) {
    throw new Error("A course with that name already exists in this category.");
  }

  await putContent({
    encodedContent: Buffer.from("Created by operator UI.\n", "utf8").toString(
      "base64"
    ),
    message: `Create course ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [trimmedCategory, trimmedCourse, ".gitkeep"],
  });
}

export async function createOperatorArticle({
  article,
  category,
  content,
  course,
  prerequisites,
  title,
}: {
  article: string;
  category: string;
  content?: string;
  course: string;
  prerequisites?: string[];
  title?: string;
}) {
  await requireOperatorAuthentication();
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();
  const trimmedArticle = article.trim();

  if (!trimmedCategory || !trimmedCourse || !trimmedArticle) {
    throw new Error("Category, course, and article are required.");
  }

  if (!(await pathExists(trimmedCategory, trimmedCourse))) {
    throw new Error("Selected course does not exist.");
  }

  if (await pathExists(trimmedCategory, trimmedCourse, "notes.md")) {
    throw new Error(
      "This course still uses the legacy single-article layout. Create a new multi-article course instead."
    );
  }

  if (await pathExists(trimmedCategory, trimmedCourse, trimmedArticle)) {
    throw new Error("An article with that name already exists in this course.");
  }

  const raw = buildArticleDraft({
    content,
    prerequisites,
    title: title?.trim() || trimmedArticle,
  });

  await putContent({
    encodedContent: Buffer.from(raw, "utf8").toString("base64"),
    message: `Create article ${trimmedArticle} in ${trimmedCourse}`,
    pathSegments: [trimmedCategory, trimmedCourse, trimmedArticle, "notes.md"],
  });
}

export async function createOperatorArticleInFolder({
  article,
  content,
  parentPath,
  prerequisites,
  title,
}: {
  article: string;
  content?: string;
  parentPath?: string[];
  prerequisites?: string[];
  title?: string;
}) {
  await requireOperatorAuthentication();
  const trimmedArticle = article.trim();
  const normalizedParentPath = (parentPath ?? []).map((segment) => segment.trim()).filter(Boolean);

  if (!trimmedArticle) {
    throw new Error("Article name is required.");
  }

  if (await pathExists(...normalizedParentPath, trimmedArticle)) {
    throw new Error("An article with that name already exists here.");
  }

  const raw = buildArticleDraft({
    content,
    prerequisites,
    title: title?.trim() || trimmedArticle,
  });

  await putContent({
    encodedContent: Buffer.from(raw, "utf8").toString("base64"),
    message: `Create article ${trimmedArticle}`,
    pathSegments: [...normalizedParentPath, trimmedArticle, "notes.md"],
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

async function copyTree(
  fromPathSegments: string[],
  toPathSegments: string[],
  label: string
) {
  const entries = await getDirectoryEntries(...fromPathSegments);
  const directories = entries
    .filter((entry) => entry.type === "dir")
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const files = entries
    .filter((entry) => entry.type === "file")
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const file of files) {
    const sourceFile = await getFileContentEntry(...fromPathSegments, file.name);
    if (!sourceFile?.content) {
      continue;
    }

    await putContent({
      encodedContent: sourceFile.content as string,
      message: `Copy ${file.name} while renaming ${label}`,
      pathSegments: [...toPathSegments, file.name],
    });
  }

  for (const directory of directories) {
    await copyTree(
      [...fromPathSegments, directory.name],
      [...toPathSegments, directory.name],
      label
    );
  }
}

export async function saveOperatorArticle({
  article,
  category,
  course,
  raw,
  sha,
}: {
  article?: string;
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

  const parsed = parseArticleDraft(trimmedRaw, article?.trim() || trimmedCourse);
  if (!parsed.title.trim()) {
    throw new Error("Article title cannot be empty.");
  }

  const result = await putContent({
    encodedContent: Buffer.from(
      trimmedRaw.endsWith("\n") ? trimmedRaw : `${trimmedRaw}\n`,
      "utf8"
    ).toString("base64"),
    message: `Update article ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: article?.trim()
      ? [trimmedCategory, trimmedCourse, article.trim(), "notes.md"]
      : [trimmedCategory, trimmedCourse, "notes.md"],
    sha,
  });

  return {
    sha: result.sha,
    title: parsed.title,
  };
}

export async function saveOperatorArticleByPath({
  pathSegments,
  raw,
  sha,
}: {
  pathSegments: string[];
  raw: string;
  sha?: string;
}) {
  await requireOperatorAuthentication();
  const normalizedPath = pathSegments.map((segment) => segment.trim()).filter(Boolean);
  const trimmedRaw = raw.replace(/\r\n/g, "\n");

  if (normalizedPath.length === 0) {
    throw new Error("Article path is required.");
  }

  if (!trimmedRaw.trim()) {
    throw new Error("Article content cannot be empty.");
  }

  const fallbackTitle = normalizedPath[normalizedPath.length - 1] ?? "Untitled";
  const parsed = parseArticleDraft(trimmedRaw, fallbackTitle);
  if (!parsed.title.trim()) {
    throw new Error("Article title cannot be empty.");
  }

  const result = await putContent({
    encodedContent: Buffer.from(
      trimmedRaw.endsWith("\n") ? trimmedRaw : `${trimmedRaw}\n`,
      "utf8"
    ).toString("base64"),
    message: `Update article ${fallbackTitle}`,
    pathSegments: [...normalizedPath, "notes.md"],
    sha,
  });

  return {
    sha: result.sha,
    title: parsed.title,
  };
}

export async function deleteOperatorCategory(category: string) {
  await requireOperatorAuthentication();
  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    throw new Error("Category name is required.");
  }

  await deleteTree([trimmedCategory], `category ${trimmedCategory}`);
}

export async function deleteOperatorFolderByPath(pathSegments: string[]) {
  await requireOperatorAuthentication();
  const normalizedPath = pathSegments.map((segment) => segment.trim()).filter(Boolean);

  if (normalizedPath.length === 0) {
    throw new Error("Folder path is required.");
  }

  await deleteTree(normalizedPath, `folder ${normalizedPath[normalizedPath.length - 1]}`);
}

export async function renameOperatorFolderByPath({
  nextName,
  pathSegments,
}: {
  nextName: string;
  pathSegments: string[];
}) {
  await requireOperatorAuthentication();
  const normalizedPath = pathSegments.map((segment) => segment.trim()).filter(Boolean);
  const trimmedNextName = nextName.trim();

  if (normalizedPath.length === 0) {
    throw new Error("Folder path is required.");
  }

  if (!trimmedNextName) {
    throw new Error("Folder name is required.");
  }

  const currentName = normalizedPath[normalizedPath.length - 1] ?? "";
  if (!currentName) {
    throw new Error("Folder path is required.");
  }

  if (currentName === trimmedNextName) {
    return {
      nextPathSegments: normalizedPath,
    };
  }

  const parentPath = normalizedPath.slice(0, -1);
  const nextPathSegments = [...parentPath, trimmedNextName];

  if (await pathExists(...nextPathSegments)) {
    throw new Error("A folder with that name already exists here.");
  }

  await copyTree(normalizedPath, nextPathSegments, currentName);
  await deleteTree(normalizedPath, `folder ${currentName}`);

  return {
    nextPathSegments,
  };
}

export async function deleteOperatorCourse({
  category,
  course,
}: {
  category: string;
  course: string;
}) {
  await requireOperatorAuthentication();
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

export async function deleteOperatorArticle({
  article,
  category,
  course,
}: {
  article: string;
  category: string;
  course: string;
}) {
  await requireOperatorAuthentication();
  const trimmedCategory = category.trim();
  const trimmedCourse = course.trim();
  const trimmedArticle = article.trim();

  if (!trimmedCategory || !trimmedCourse || !trimmedArticle) {
    throw new Error("Category, course, and article are required.");
  }

  await deleteTree(
    [trimmedCategory, trimmedCourse, trimmedArticle],
    `article ${trimmedArticle} in ${trimmedCourse}`
  );
}

export async function deleteOperatorArticleByPath(pathSegments: string[]) {
  await requireOperatorAuthentication();
  const normalizedPath = pathSegments.map((segment) => segment.trim()).filter(Boolean);

  if (normalizedPath.length === 0) {
    throw new Error("Article path is required.");
  }

  await deleteTree(normalizedPath, `article ${normalizedPath[normalizedPath.length - 1]}`);
}

function sanitizeAssetSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

function parsePngDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Drawing must be exported as a PNG image.");
  }

  const approximateBytes = Math.ceil(match[1].length * 0.75);
  if (approximateBytes > MAX_IMAGE_BYTES) {
    throw new Error("Drawing exceeds the 10 MB size limit.");
  }

  return match[1];
}

export async function createOperatorDrawingAsset({
  article,
  category,
  course,
  darkDataUrl,
  lightDataUrl,
  name,
}: {
  article?: string;
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
  const imagePath = article?.trim()
    ? [trimmedCategory, trimmedCourse, article.trim(), "images"]
    : [trimmedCategory, trimmedCourse, "images"];

  const lightResult = await putContent({
    encodedContent: encodedLightContent,
    message: `Add drawing ${lightFilename} to ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [...imagePath, lightFilename],
  });

  let darkResult: Awaited<ReturnType<typeof putContent>>;

  try {
    darkResult = await putContent({
      encodedContent: encodedDarkContent,
      message: `Add drawing ${darkFilename} to ${trimmedCourse} in ${trimmedCategory}`,
      pathSegments: [...imagePath, darkFilename],
    });
  } catch (error) {
    if (lightResult.sha) {
      try {
        await deleteContent({
          message: `Rollback drawing ${lightFilename} in ${trimmedCourse} after dark variant save failed`,
          pathSegments: [...imagePath, lightFilename],
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
    darkUrl: article?.trim()
      ? rawUrl(trimmedCategory, trimmedCourse, article.trim(), "images", darkFilename)
      : rawUrl(trimmedCategory, trimmedCourse, "images", darkFilename),
    displayName: `${sharedName}.png`,
    filename: lightFilename,
    markdownPath: `images/${lightFilename}`,
    sha: lightResult.sha ?? "",
    themeManaged: true,
    url: article?.trim()
      ? rawUrl(trimmedCategory, trimmedCourse, article.trim(), "images", lightFilename)
      : rawUrl(trimmedCategory, trimmedCourse, "images", lightFilename),
  };
}

export async function createOperatorDrawingAssetByPath({
  articlePath,
  darkDataUrl,
  lightDataUrl,
  name,
}: {
  articlePath: string[];
  darkDataUrl: string;
  lightDataUrl: string;
  name?: string;
}) {
  await requireOperatorAuthentication();
  const normalizedPath = articlePath.map((segment) => segment.trim()).filter(Boolean);

  if (normalizedPath.length === 0) {
    throw new Error("Article path is required.");
  }

  const encodedLightContent = parsePngDataUrl(lightDataUrl);
  const encodedDarkContent = parsePngDataUrl(darkDataUrl);
  const baseName = sanitizeAssetSegment(name || "drawing") || "drawing";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sharedName = `${baseName}-${stamp}`;
  const lightFilename = `${sharedName}-light.png`;
  const darkFilename = `${sharedName}-dark.png`;
  const imagePath = [...normalizedPath, "images"];

  const lightResult = await putContent({
    encodedContent: encodedLightContent,
    message: `Add drawing ${lightFilename} to ${normalizedPath[normalizedPath.length - 1]}`,
    pathSegments: [...imagePath, lightFilename],
  });

  let darkResult: Awaited<ReturnType<typeof putContent>>;

  try {
    darkResult = await putContent({
      encodedContent: encodedDarkContent,
      message: `Add drawing ${darkFilename} to ${normalizedPath[normalizedPath.length - 1]}`,
      pathSegments: [...imagePath, darkFilename],
    });
  } catch (error) {
    if (lightResult.sha) {
      try {
        await deleteContent({
          message: `Rollback drawing ${lightFilename} after dark variant save failed`,
          pathSegments: [...imagePath, lightFilename],
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
    darkUrl: rawUrl(...normalizedPath, "images", darkFilename),
    displayName: `${sharedName}.png`,
    filename: lightFilename,
    markdownPath: `images/${lightFilename}`,
    sha: lightResult.sha ?? "",
    themeManaged: true,
    url: rawUrl(...normalizedPath, "images", lightFilename),
  };
}

export async function deleteOperatorImageAsset({
  article,
  category,
  course,
  darkFilename,
  darkSha,
  filename,
  sha,
}: {
  article?: string;
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
  const imagePath = article?.trim()
    ? [trimmedCategory, trimmedCourse, article.trim(), "images"]
    : [trimmedCategory, trimmedCourse, "images"];

  if (!trimmedCategory || !trimmedCourse || !trimmedFilename || !sha) {
    throw new Error("Category, course, filename, and sha are required.");
  }

  if (darkFilename?.trim() && darkSha) {
    await deleteContent({
      allowMissing: true,
      message: `Delete image ${darkFilename.trim()} from ${trimmedCourse} in ${trimmedCategory}`,
      pathSegments: [...imagePath, darkFilename.trim()],
      sha: darkSha,
    });
  }

  await deleteContent({
    allowMissing: true,
    message: `Delete image ${trimmedFilename} from ${trimmedCourse} in ${trimmedCategory}`,
    pathSegments: [...imagePath, trimmedFilename],
    sha,
  });
}

export async function deleteOperatorImageAssetByPath({
  articlePath,
  darkFilename,
  darkSha,
  filename,
  sha,
}: {
  articlePath: string[];
  darkFilename?: string;
  darkSha?: string;
  filename: string;
  sha: string;
}) {
  await requireOperatorAuthentication();
  const normalizedPath = articlePath.map((segment) => segment.trim()).filter(Boolean);
  const trimmedFilename = filename.trim();
  const imagePath = [...normalizedPath, "images"];

  if (normalizedPath.length === 0 || !trimmedFilename || !sha) {
    throw new Error("Article path, filename, and sha are required.");
  }

  if (darkFilename?.trim() && darkSha) {
    await deleteContent({
      allowMissing: true,
      message: `Delete image ${darkFilename.trim()} from ${normalizedPath[normalizedPath.length - 1]}`,
      pathSegments: [...imagePath, darkFilename.trim()],
      sha: darkSha,
    });
  }

  await deleteContent({
    allowMissing: true,
    message: `Delete image ${trimmedFilename} from ${normalizedPath[normalizedPath.length - 1]}`,
    pathSegments: [...imagePath, trimmedFilename],
    sha,
  });
}
