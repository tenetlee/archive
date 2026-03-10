"use client";

import { useActionState, useState } from "react";
import { renameFolderAction, type OperatorFormState } from "./content-actions";

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4 fill-none stroke-current"
    >
      <path
        d="M4 20h4l9.5-9.5a1.8 1.8 0 0 0 0-2.5l-1.5-1.5a1.8 1.8 0 0 0-2.5 0L4 16v4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M13 6l5 5" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  );
}

export function OperatorRenameFolderButton({
  pathSegments,
}: {
  pathSegments: string[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(pathSegments[pathSegments.length - 1] ?? "");
  const [state, formAction, pending] = useActionState<OperatorFormState, FormData>(
    renameFolderAction,
    null
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground"
        aria-label="Rename folder"
        title="Rename folder"
      >
        <PencilIcon />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25 px-4">
          <form
            action={formAction}
            className="w-full max-w-md border border-border bg-surface p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
          >
            <input
              type="hidden"
              name="pathSegments"
              value={pathSegments.join("/")}
            />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Rename Folder
            </p>
            <h2 className="mt-2 text-2xl tracking-tight text-foreground">
              {pathSegments[pathSegments.length - 1]}
            </h2>
            <label className="mt-4 block text-sm font-medium text-foreground">
              New folder name
            </label>
            <input
              type="text"
              name="name"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            />
            {state?.error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {state.error}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setName(pathSegments[pathSegments.length - 1] ?? "");
                }}
                className="border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
