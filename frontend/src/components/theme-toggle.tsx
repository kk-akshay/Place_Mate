"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";


export function ThemeToggle() {
  const {
    resolvedTheme,
    setTheme,
  } = useTheme();


  function toggleTheme() {
    setTheme(
      resolvedTheme === "dark"
        ? "light"
        : "dark",
    );
  }


  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative rounded-xl border-border/70 bg-background/70 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:shadow-md"
      aria-label="Toggle light and dark mode"
    >
      <Sun
        className="size-[1.1rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />

      <Moon
        className="absolute size-[1.1rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
    </Button>
  );
}