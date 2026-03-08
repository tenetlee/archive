"use client";

import { useActionState } from "react";
import { createCategoryAction, type OperatorFormState } from "./content-actions";

export function OperatorCreateCategoryForm() {
  const [state, formAction, pending] = useActionState<OperatorFormState, FormData>(
    createCategoryAction,
    null
  );

  return (
    <form action={formAction} className="border border-border bg-surface p-6">
      <div className="mb-6">
        <h1 className="text-3xl tracking-tight text-foreground">New Category</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Categories are top-level folders in the content repo. Create one here,
          then add courses underneath it.
        </p>
      </div>

      <label className="mb-2 block text-sm font-medium text-foreground">
        Category name
      </label>
      <input
        type="text"
        name="name"
        required
        autoFocus
        placeholder="Computer Science"
        className="w-full border border-border bg-background px-3 py-2 text-foreground"
      />

      {state?.error ? (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create category"}
        </button>
      </div>
    </form>
  );
}
