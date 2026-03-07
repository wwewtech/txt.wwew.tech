"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
  title?: string;
  content: React.ReactNode;
};

type DragSegmentedProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
};

export function DragSegmented<T extends string>({
  options,
  value,
  onValueChange,
  className,
  buttonClassName,
}: DragSegmentedProps<T>) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );

  const pickByPointer = React.useCallback(
    (clientX: number) => {
      const element = trackRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const segmentWidth = rect.width / options.length;
      const raw = Math.floor((clientX - rect.left) / segmentWidth);
      const index = Math.min(options.length - 1, Math.max(0, raw));
      const next = options[index];
      if (next && next.value !== value) {
        onValueChange(next.value);
      }
    },
    [onValueChange, options, value]
  );

  return (
    <div className={cn("inline-flex rounded-xl border border-border/70 bg-muted/20 p-1", className)}>
      <div
        ref={trackRef}
        className="relative inline-grid"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        onPointerMove={(event) => {
          if (!dragging) return;
          pickByPointer(event.clientX);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-primary",
            dragging ? "transition-transform duration-100" : "transition-transform duration-200"
          )}
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              title={option.title ?? option.label}
              onClick={() => onValueChange(option.value)}
              onPointerDown={(event) => {
                setDragging(true);
                event.currentTarget.setPointerCapture(event.pointerId);
                pickByPointer(event.clientX);
              }}
              className={cn(
                "relative z-10 inline-flex h-7 items-center justify-center rounded-lg px-2 text-muted-foreground transition-colors",
                active && "text-primary-foreground",
                buttonClassName
              )}
            >
              {option.content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
