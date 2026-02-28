"use client";

import { useActionState } from "react";
import { operatorLogin } from "./actions";

type LoginState = { error?: string } | null;

export function OperatorLoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    async (_prev, formData) => {
      const result = await operatorLogin(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <form
        action={formAction}
        className="w-full max-w-sm border border-border bg-surface p-6"
      >
        <h1 className="mb-4 flex items-baseline gap-2 text-xl font-normal tracking-tight text-foreground" style={{ fontFamily: "var(--font-title)"}}>
		Operator Access
        </h1>
        <p className="mb-4 text-sm text-muted">
          Enter the operator password to view uncached content.
        </p>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="mb-4 w-full border border-border bg-background px-3 py-2 text-foreground"
        />
        {state?.error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          className="w-full border border-border bg-foreground px-4 py-2 text-background"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
