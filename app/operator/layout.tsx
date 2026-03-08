import type { Metadata } from "next";
import {
  isOperatorAuthenticated,
  isOperatorConfigured,
} from "@/lib/operator-auth";
import { Header } from "../components/header";
import { OperatorHeader } from "./OperatorHeader";
import { OperatorLoginForm } from "./OperatorLoginForm";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Operator | ARCHIVE",
};

export default async function OperatorLayout({
  children,
}: { children: React.ReactNode }) {
  const configured = isOperatorConfigured();
  const authenticated = await isOperatorAuthenticated();

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header showPath={false} />
        {configured ? (
          <OperatorLoginForm />
        ) : (
          <div className="mx-auto mt-24 max-w-sm border border-border bg-surface p-6">
            <h1
              className="mb-3 text-xl font-normal tracking-tight text-foreground"
            >
              Operator Access
            </h1>
            <p className="text-sm leading-6 text-muted">
              Set both <code>OPERATOR_PASSWORD</code> and{" "}
              <code>OPERATOR_SECRET</code> to enable the uncached operator
              route.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="operator-shell min-h-screen bg-background">
      <OperatorHeader />
      {children}
    </div>
  );
}
