"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { DragSegmented } from "@/components/drag-segmented";

type ThemeValue = "light" | "dark" | "system";

const options: { value: ThemeValue; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const value = (mounted ? (theme as ThemeValue | undefined) : "system") ?? "system";

  return (
    <DragSegmented
      value={value}
      onValueChange={(next) => setTheme(next)}
      options={options.map(({ value: optionValue, label, Icon }) => ({
        value: optionValue,
        label,
        content: <Icon className="h-3.5 w-3.5" />,
      }))}
      buttonClassName="w-7 px-0"
    />
  );
}
