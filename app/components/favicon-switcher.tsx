"use client";

import { useEffect } from "react";
import { useTheme } from "./theme-provider";

const FAVICON_LIGHT = "/archive-icon.png?v=2";
const FAVICON_DARK = "/archive-icon-white.png?v=2";

export function FaviconSwitcher() {
  const { theme } = useTheme();

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) return;
    link.href = theme === "dark" ? FAVICON_DARK : FAVICON_LIGHT;
  }, [theme]);

  return null;
}
