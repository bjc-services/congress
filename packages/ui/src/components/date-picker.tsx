"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  /**
   * Selected date value (ISO date string or Date object)
   */
  value?: string | Date;
  /**
   * Callback when date changes (returns ISO date string)
   */
  onChange?: (date: string | undefined) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Whether the picker is disabled
   */
  disabled?: boolean;
  /**
   * HTML id attribute
   */
  id?: string;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Minimum selectable date
   */
  minDate?: Date;
  /**
   * Maximum selectable date
   */
  maxDate?: Date;
  /**
   * Calendar caption layout
   */
  captionLayout?: "dropdown" | "dropdown-months" | "dropdown-years" | "label";
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  id,
  className,
  minDate,
  maxDate,
  captionLayout = "dropdown",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value) return undefined;
    return typeof value === "string" ? new Date(value) : value;
  }, [value]);

  const handleSelect = React.useCallback(
    (selectedDate: Date | undefined) => {
      if (selectedDate) {
        // Convert to ISO date string (YYYY-MM-DD)
        const isoDate = selectedDate.toISOString().split("T")[0];
        onChange?.(isoDate);
      } else {
        onChange?.(undefined);
      }
      setOpen(false);
    },
    [onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span>{date ? format(date, "PPP") : placeholder}</span>
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout={captionLayout}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
