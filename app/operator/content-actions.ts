"use server";

import { redirect } from "next/navigation";
import { categorySlug, courseSlug } from "@/lib/github";
import {
  createOperatorCategory,
  createOperatorCourse,
  saveOperatorArticle,
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

export async function createCategoryAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const name = stringField(formData, "name");

  try {
    await createOperatorCategory(name);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create category.",
    };
  }

  redirect(`/operator/${categorySlug(name)}`);
}

export async function createCourseAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const category = stringField(formData, "category");
  const course = stringField(formData, "course");
  const title = stringField(formData, "title");
  const prerequisites = stringField(formData, "prerequisites")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const content = stringField(formData, "content");

  try {
    await createOperatorCourse({
      category,
      content,
      course,
      prerequisites,
      title,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create course.",
    };
  }

  redirect(`/operator/${categorySlug(category)}/${courseSlug(course)}/edit`);
}

export async function saveArticleAction(
  _prevState: OperatorFormState,
  formData: FormData
): Promise<OperatorFormState> {
  const category = stringField(formData, "category");
  const course = stringField(formData, "course");
  const raw = stringField(formData, "raw");
  const sha = stringField(formData, "sha") || undefined;

  try {
    const result = await saveOperatorArticle({
      category,
      course,
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
