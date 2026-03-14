"use client";

import * as React from "react";
import { cn } from "@/lib";

type Option<T extends string> = {
  value: T;
  label: string;
  title?: string;
  content: React.ReactNode;
};

type DragSegmentedProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  indicatorClassName?: string;
  trackClassName?: string;
};

export function DragSegmented<T extends string>({
  options,
  value,
  onValueChange,
  className,
  buttonClassName,
  activeButtonClassName,
  indicatorClassName,
  trackClassName,
}: DragSegmentedProps<T>) {
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const pointerIdRef = React.useRef<number | null>(null);
  const dragStartXRef = React.useRef(0);
  const dragMovedRef = React.useRef(false);
  const suppressClickRef = React.useRef(false);
  const [dragging, setDragging] = React.useState(false);
  const [dragTranslate, setDragTranslate] = React.useState<number | null>(null);

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
      return index;
    },
    [options.length]
  );

  const translateByPointer = React.useCallback(
    (clientX: number) => {
      const element = trackRef.current;
      if (!element) return 0;

      const rect = element.getBoundingClientRect();
      const segmentWidth = rect.width / options.length;
      const pointerX = Math.min(rect.width, Math.max(0, clientX - rect.left));
      const left = Math.min(rect.width - segmentWidth, Math.max(0, pointerX - segmentWidth / 2));

      return (left / segmentWidth) * 100;
    },
    [options.length]
  );

  const stopDragging = React.useCallback(() => {
    pointerIdRef.current = null;
    dragMovedRef.current = false;
    setDragging(false);
    setDragTranslate(null);
  }, []);

  const indicatorTranslate = dragTranslate ?? activeIndex * 100;

  return (
    <div className={cn("inline-flex rounded-xl border border-border/70 bg-muted/20 p-1", className)}>
      <div
        ref={trackRef}
        className={cn("relative inline-grid touch-none select-none", trackClassName)}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        onPointerDown={(event) => {
          pointerIdRef.current = event.pointerId;
          dragStartXRef.current = event.clientX;
          dragMovedRef.current = false;
        }}
        onPointerMove={(event) => {
          if (pointerIdRef.current !== event.pointerId) return;

          if (!dragMovedRef.current && Math.abs(event.clientX - dragStartXRef.current) > 3) {
            dragMovedRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            setDragTranslate(translateByPointer(event.clientX));
            return;
          }

          if (!dragging) return;
          setDragTranslate(translateByPointer(event.clientX));
        }}
        onPointerUp={(event) => {
          if (pointerIdRef.current !== event.pointerId) return;

          if (dragMovedRef.current) {
            const index = pickByPointer(event.clientX);
            if (typeof index === "number") {
              const next = options[index];
              if (next && next.value !== value) {
                onValueChange(next.value);
              }
            }
            suppressClickRef.current = true;
          }

          stopDragging();
        }}
        onPointerCancel={() => stopDragging()}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-primary",
            dragging ? "transition-none" : "transition-transform duration-200 ease-out",
            indicatorClassName
          )}
          style={{
            width: `${100 / options.length}%`,
            transform: `translateX(${indicatorTranslate}%)`,
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
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                onValueChange(option.value);
              }}
              className={cn(
                "relative z-10 inline-flex h-7 items-center justify-center rounded-lg px-2 text-muted-foreground transition-colors",
                active && (activeButtonClassName ?? "text-primary-foreground"),
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
