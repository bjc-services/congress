import { useEffect, useMemo, useState } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check } from "lucide-react";

import { cn } from "../lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "./command";
import { Input } from "./input";
import { Popover, PopoverAnchor, PopoverContent } from "./popover";
import { Skeleton } from "./skeleton";

interface Props<T extends string> {
  selectedValue: T;
  onSelectedValueChange: (value: T) => void;

  /**
   * When you want to control the search value from outside, use this prop
   */
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  items: { value: T; label: string }[];
  isLoading: boolean;
  emptyMessage: string;
  placeholder: string;
  disabled?: boolean;
}

export function AutoComplete<T extends string>({
  selectedValue,
  onSelectedValueChange,
  searchValue: incomingSearchValue = "",
  onSearchValueChange: onExternalSearchValueChange,
  items,
  isLoading,
  emptyMessage,
  placeholder,
  disabled = false,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [internalSearchValue, setInternalSearchValue] =
    useState(incomingSearchValue);

  const searchValue = incomingSearchValue || internalSearchValue;

  const labels = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.value] = item.label;
          return acc;
        },
        {} as Record<string, string>,
      ),
    [items],
  );

  // Initialize search value from selected item's label when items load
  useEffect(() => {
    if (selectedValue && labels[selectedValue] && !searchValue) {
      const label = labels[selectedValue];
      onExternalSearchValueChange?.(label);
      setInternalSearchValue(label);
    }
  }, [selectedValue, labels, searchValue, onExternalSearchValueChange]);

  const reset = () => {
    onSelectedValueChange("" as T);
    onExternalSearchValueChange?.("");
    setInternalSearchValue("");
  };

  const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (
      !e.relatedTarget?.hasAttribute("cmdk-list") &&
      labels[selectedValue] !== searchValue
    ) {
      reset();
    }
  };

  const onSelectItem = (inputValue: string) => {
    if (inputValue === selectedValue) {
      reset();
    } else {
      onSelectedValueChange(inputValue as T);
      onExternalSearchValueChange?.(labels[inputValue] ?? "");
      setInternalSearchValue(labels[inputValue] ?? "");
    }
    setOpen(false);
  };

  const onSearchValueChange = (value: string) => {
    onExternalSearchValueChange?.(value);
    setInternalSearchValue(value);
  };

  return (
    <div className="flex items-center">
      <Popover open={disabled === true ? false : open} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <PopoverAnchor asChild>
            <CommandPrimitive.Input
              className="bg-background"
              asChild
              value={searchValue}
              disabled={disabled}
              autoComplete="rutjfkde"
              onValueChange={onSearchValueChange}
              onKeyDown={(e) => setOpen(e.key !== "Escape")}
              onMouseDown={() => setOpen((open) => !!searchValue || !open)}
              onFocus={() => setOpen(true)}
              onBlur={onInputBlur}
            >
              <Input placeholder={placeholder} />
            </CommandPrimitive.Input>
          </PopoverAnchor>
          {!open && <CommandList aria-hidden="true" className="hidden" />}
          <PopoverContent
            asChild
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (
                e.target instanceof Element &&
                e.target.hasAttribute("cmdk-input")
              ) {
                e.preventDefault();
              }
            }}
            align="start"
            className="min-w-[--radix-popper-anchor-width] p-0"
          >
            <CommandList>
              {isLoading && (
                <CommandPrimitive.Loading>
                  <div className="p-1">
                    <Skeleton className="h-6" />
                  </div>
                </CommandPrimitive.Loading>
              )}
              {items.length > 0 && !isLoading ? (
                <CommandGroup>
                  {items.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onMouseDown={(e) => e.preventDefault()}
                      onSelect={onSelectItem}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedValue === option.value
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}
              {!isLoading ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
            </CommandList>
          </PopoverContent>
        </Command>
      </Popover>
    </div>
  );
}
