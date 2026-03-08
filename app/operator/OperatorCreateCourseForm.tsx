"use client";

import { useActionState } from "react";
import { createCourseAction, type OperatorFormState } from "./content-actions";

const STARTER_CONTENT = `## Overview

Write the first section here.

## Key Ideas

- Add the core concepts
- Link to supporting material
- Include diagrams or equations when useful
`;

export function OperatorCreateCourseForm({
  categories,
  initialCategory,
}: {
  categories: string[];
  initialCategory?: string;
}) {
  const [state, formAction, pending] = useActionState<OperatorFormState, FormData>(
    createCourseAction,
    null
  );

  if (categories.length === 0) {
    return (
      <div className="border border-border bg-surface p-6">
        <h1 className="text-3xl tracking-tight text-foreground">New Course</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Create a category first. Courses live inside categories and create a
          `notes.md` article immediately.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="border border-border bg-surface p-6">
      <div className="mb-6">
        <h1 className="text-3xl tracking-tight text-foreground">New Course</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          This creates the course folder and its initial article in one step.
          You can refine the markdown immediately after creation in the operator
          editor.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            name="category"
            defaultValue={initialCategory || categories[0]}
            className="w-full border border-border bg-background px-3 py-2 text-foreground"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Course folder name
          </label>
          <input
            type="text"
            name="course"
            required
            autoFocus
            placeholder="Linear Algebra"
            className="w-full border border-border bg-background px-3 py-2 text-foreground"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Article title
          </label>
          <input
            type="text"
            name="title"
            placeholder="Linear Algebra"
            className="w-full border border-border bg-background px-3 py-2 text-foreground"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Prerequisites
          </label>
          <input
            type="text"
            name="prerequisites"
            placeholder="Mathematics/Calculus 1, Mathematics/Proof Writing"
            className="w-full border border-border bg-background px-3 py-2 text-foreground"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Initial markdown
        </label>
        <textarea
          name="content"
          rows={16}
          defaultValue={STARTER_CONTENT}
          className="w-full border border-border bg-background px-3 py-3 font-mono text-sm leading-6 text-foreground"
        />
      </div>

      {state?.error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create course"}
        </button>
      </div>
    </form>
  );
}
