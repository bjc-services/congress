"use client";

import type { ToasterProps } from "sonner";
import { Toaster as Sonner, toast } from "sonner";

export const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"light"} // TODO: Theme support
      className="toaster group"
      richColors
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { toast };
