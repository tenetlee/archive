"use client";

import { useActionState } from "react";
import { createFolderAction, type OperatorFormState } from "./content-actions";

export function OperatorCreateFolderForm({
  parentLabel,
  parentPath,
}: {
  parentLabel: string;
  parentPath?: string[];
}) {
  const [state, formAction, pending] = useActionState<OperatorFormState, FormData>(
    createFolderAction,
    null
  );

  return (
    <form action={formAction} className="border border-border bg-surface p-6">
      <input
        type="hidden"
        name="parentPath"
        value={(parentPath ?? []).join("/")}
      />

      <div className="mb-6">
        <h1 className="text-3xl tracking-tight text-foreground">New Folder</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          This creates an empty folder at the current location.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Parent folder
          </label>
          <input
            type="text"
            value={parentLabel}
            disabled
            className="w-full border border-border bg-background px-3 py-2 text-foreground disabled:opacity-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Folder name
          </label>
          <input
            type="text"
            name="name"
            required
            autoFocus
            placeholder="Linear Algebra"
            className="w-full border border-border bg-background px-3 py-2 text-foreground"
          />
        </div>
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
          {pending ? "Creating..." : "Create folder"}
        </button>
      </div>
    </form>
  );
}
