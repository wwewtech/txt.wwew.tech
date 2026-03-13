"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib";

interface MobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  direction?: "left" | "right" | "bottom";
  children: React.ReactNode;
  className?: string;
}

export function MobileDrawer({
  open,
  onOpenChange,
  direction = "left",
  children,
  className,
}: MobileDrawerProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={direction}
    >
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
        />
        <Drawer.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background xl:hidden",
            direction === "left" && "bottom-0 left-0 top-0 w-[85vw] max-w-sm border-r border-border/50",
            direction === "right" && "bottom-0 right-0 top-0 w-[85vw] max-w-sm border-l border-border/50",
            direction === "bottom" && "bottom-0 left-0 right-0 max-h-[90vh] border-t border-border/50 rounded-t-2xl",
            className
          )}
        >
          <Drawer.Title className="sr-only">Navigation</Drawer.Title>
          <Drawer.Description className="sr-only">
            Side navigation panel
          </Drawer.Description>
          {direction === "bottom" && (
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
          )}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
