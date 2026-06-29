"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { type EventTheme } from "@/lib/api";


interface ThemeContextType {
  theme: EventTheme;
  setPreviewTheme: (theme: EventTheme | null) => void;
}

const defaultTheme: EventTheme = {
  logoUrl: null,
  fontFamily: "mono",
  primaryColor: "#000000",
  primaryTextColor: "#FFFFFF",
  accentColor: "#0000FF",
  accentTextColor: "#FFFFFF",
  backgroundColor: "#FFFFFF",
  textColor: "#000000",
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setPreviewTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [previewTheme, setPreviewTheme] = useState<EventTheme | null>(null);

  const activeTheme: EventTheme = {
    ...defaultTheme,
    ...(previewTheme || {}),
  };

  useEffect(() => {
    // テーマによる動的CSS変数上書きを無効化し、デフォルトのindex.cssに統一
  }, []);


  return (
    <ThemeContext.Provider value={{ theme: activeTheme, setPreviewTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
