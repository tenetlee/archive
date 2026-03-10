"use server";

import { redirect } from "next/navigation";
import { pathSegmentSlug } from "@/lib/github";
import { requireOperatorAuthentication } from "@/lib/operator-auth";
import {
  createOperatorArticleInFolder,
  createOperatorDrawingAssetByPath,
  createOperatorFolder,
  deleteOperatorArticleByPath,
  deleteOperatorFolderByPath,
  deleteOperatorImageAssetByPath,
  renameOperatorFolderByPath,
  saveOperatorArticleByPath,
} from "@/lib/operator-content";

export type OperatorFormState =
  | {
      error?: string;
      message?: string;
      sha?: string;
    }
  | null;

function stringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parsePathField(value: string): string[] {
  return value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function operatorRouteForPath(pathSegments: string[]) {
  if (pathSegments.length === 0) {
    return "/operator";
  }

  return `/operator/${pathSegments.map(pathSegmentSlug).join("/")}`;
}

export async function createFolderAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const name = stringField(formData, "name");
  const parentPath = parsePathField(stringField(formData, "parentPath"));
  const redirectPath = operatorRouteForPath([...parentPath, name]);

  try {
    await requireOperatorAuthentication();
    await createOperatorFolder({
      name,
      parentPath,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create folder.",
    };
  }

  redirect(redirectPath);
}

export async function createCategoryAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const name = stringField(formData, "name");
  const redirectPath = operatorRouteForPath([name]);

  try {
    await requireOperatorAuthentication();
    await createOperatorFolder({ name });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create category.",
    };
  }

  redirect(redirectPath);
}

export async function createCourseAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const category = stringField(formData, "category");
  const course = stringField(formData, "course");
  const redirectPath = operatorRouteForPath([category, course].filter(Boolean));

  try {
    await requireOperatorAuthentication();
    await createOperatorFolder({
      name: course,
      parentPath: category ? [category] : [],
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create course.",
    };
  }

  redirect(redirectPath);
}

export async function createArticleAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const article = stringField(formData, "article");
  const parentPath = parsePathField(stringField(formData, "parentPath"));
  const title = stringField(formData, "title");
  const prerequisites = stringField(formData, "prerequisites")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const content = stringField(formData, "content");
  const redirectPath = `${operatorRouteForPath([
    ...parentPath,
    article || title,
  ])}/edit`;

  try {
    await requireOperatorAuthentication();
    await createOperatorArticleInFolder({
      article: article || title,
      content,
      parentPath,
      prerequisites,
      title,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create article.",
    };
  }

  redirect(redirectPath);
}

export async function saveArticleAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const articlePath = parsePathField(stringField(formData, "articlePath"));
  const raw = stringField(formData, "raw");
  const sha = stringField(formData, "sha") || undefined;

  try {
    await requireOperatorAuthentication();
    const result = await saveOperatorArticleByPath({
      pathSegments: articlePath,
      raw,
      sha,
    });

    return {
      message: `Saved ${result.title}.`,
      sha: result.sha,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save article.",
      sha,
    };
  }
}

export async function saveDrawingAction(input: {
  articlePath: string[];
  darkDataUrl: string;
  lightDataUrl: string;
  name?: string;
}) {
  await requireOperatorAuthentication();
  return createOperatorDrawingAssetByPath(input);
}

export async function deleteImageAction(input: {
  articlePath: string[];
  darkFilename?: string;
  darkSha?: string;
  filename: string;
  sha: string;
}) {
  await requireOperatorAuthentication();
  await deleteOperatorImageAssetByPath(input);
}

export async function deleteOperatorEntryAction(input: {
  kind: "folder" | "article";
  pathSegments: string[];
}) {
  await requireOperatorAuthentication();

  if (input.kind === "article") {
    await deleteOperatorArticleByPath(input.pathSegments);
    return;
  }

  await deleteOperatorFolderByPath(input.pathSegments);
}

export async function renameFolderAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const nextName = stringField(formData, "name");
  const pathSegments = parsePathField(stringField(formData, "pathSegments"));
  let redirectPath = operatorRouteForPath(pathSegments);

  try {
    await requireOperatorAuthentication();
    const result = await renameOperatorFolderByPath({
      nextName,
      pathSegments,
    });
    redirectPath = operatorRouteForPath(result.nextPathSegments);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to rename folder.",
    };
  }

  redirect(redirectPath);
}
