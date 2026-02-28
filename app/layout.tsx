import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ARCHIVE | TENET",
  description:
    "Open source education platform — comprehensive courses for everyone.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
