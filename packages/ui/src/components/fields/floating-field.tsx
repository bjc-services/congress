import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import type { inputVariants } from "../input";
import { cn } from "../../lib/utils";
import { useFieldContext } from "./form-context";

interface FloatingFieldProps {
  label: string;
  filled?: boolean;
  className?: string;
  variant?: VariantProps<typeof inputVariants>["variant"];
  align?: VariantProps<typeof inputVariants>["align"];
  children: React.ReactNode;
}

/**
 * Wraps a control with a floating label behavior similar to MUI.
 *
 * Must be use within a field context
 *
 * Works generically:
 * - For inputs: relies on placeholder=' ' and :placeholder-shown to detect emptiness
 * - For non-input controls (select, date button): pass filled={true} to float the label
 */
export function FloatingField({
  label,
  filled = false,
  className,
  variant = "default",
  align = "left",
  children,
}: FloatingFieldProps) {
  const field = useFieldContext<string>();
  return (
    <div
      className={cn("group relative w-full", className)}
      data-filled={filled ? "true" : "false"}
      data-variant={variant}
    >
      <label
        data-align={align}
        htmlFor={field.name}
        className={cn(
          "origin-start absolute top-1/2 z-10 block -translate-y-1/2 cursor-text px-2 text-start transition-all data-[align=center]:w-full data-[align=center]:text-center data-[align=left]:text-left data-[align=right]:text-right",
          // Default variant styling
          variant === "default" && "text-muted-foreground",
          // Inverted variant styling
          variant === "inverted" && "text-background",
          // Focus within group -> float
          variant === "default" &&
            "group-focus-within:text-foreground group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium",
          variant === "inverted" &&
            "group-focus-within:text-background group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium",
          // If the following input has content (not placeholder-shown) -> float
          variant === "default" &&
            "has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs has-[+input:not(:placeholder-shown)]:font-medium",
          variant === "inverted" &&
            "has-[+input:not(:placeholder-shown)]:text-background has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs has-[+input:not(:placeholder-shown)]:font-medium",
          // Generic filled hook for non-input controls
          variant === "default" &&
            "group-data-[filled=true]:text-foreground group-data-[filled=true]:pointer-events-none group-data-[filled=true]:top-0 group-data-[filled=true]:cursor-default group-data-[filled=true]:font-medium",
          variant === "inverted" &&
            "group-data-[filled=true]:text-background group-data-[filled=true]:pointer-events-none group-data-[filled=true]:top-0 group-data-[filled=true]:cursor-default group-data-[filled=true]:font-medium",
          // For when it's a popover anchor, it will have a sibling with data-state='open' -> float
          variant === "default" &&
            "has-[+button[data-state='open']]:text-foreground has-[+button[data-state='open']]:pointer-events-none has-[+button[data-state='open']]:top-0 has-[+button[data-state='open']]:cursor-default has-[+button[data-state='open']]:font-medium",
          variant === "inverted" &&
            "has-[+button[data-state='open']]:text-background has-[+button[data-state='open']]:pointer-events-none has-[+button[data-state='open']]:top-0 has-[+button[data-state='open']]:cursor-default has-[+button[data-state='open']]:font-medium",
        )}
      >
        <span
          className={cn(
            "inline-flex px-1",
            variant === "default" && "bg-background",
            variant === "inverted" && "bg-foreground",
          )}
        >
          {label}
        </span>
      </label>
      {children}
    </div>
  );
}
