"use client";

import { useEffect } from "react";
import { useTheme } from "./theme-provider";

export function FaviconSwitcher() {
  const { theme } = useTheme();

  useEffect(() => {
    const link =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      (() => {
        const el = document.createElement("link");
        el.rel = "icon";
        document.head.appendChild(el);
        return el;
      })();
    link.href = theme === "dark" ? "/archive-icon-white.png" : "/archive-icon.png";
  }, [theme]);

  return null;
}
