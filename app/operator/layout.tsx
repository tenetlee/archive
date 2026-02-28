import { isOperatorAuthenticated } from "@/lib/operator-auth";
import { Header } from "../components/header";
import { OperatorHeader } from "./OperatorHeader";
import { OperatorLoginForm } from "./OperatorLoginForm";

export default async function OperatorLayout({
  children,
}: { children: React.ReactNode }) {
  const authenticated = await isOperatorAuthenticated();

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <OperatorLoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <OperatorHeader />
      <div className="border-b border-border bg-surface-alt px-4 py-2 text-sm text-muted">
        <span className="font-medium text-foreground">Operator mode</span>
        {" — "}
        uncached data from GitHub.{" "}
        <a href="/operator/logout" className="underline hover:text-foreground">
          Sign out
        </a>
      </div>
      {children}
    </div>
  );
}
