"use client";

import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectorOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectorOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const Selector = React.forwardRef<HTMLButtonElement, SelectorProps>(
  (
    { value, onValueChange, options, placeholder = "Select…", className, disabled },
    ref
  ) => {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild disabled={disabled}>
          <button
            ref={ref}
            className={cn(
              "flex items-center justify-between gap-2 w-full px-3 h-10 bg-gray-50 border border-gray-100 rounded-xl text-gray-900 text-base",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-shadow",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "touch-manipulation",
              className
            )}
            type="button"
          >
            <span className="flex items-center gap-2 min-w-0">
              {selectedOption?.icon && (
                <span className="flex-shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate">
                {selectedOption?.label ?? placeholder}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(
              "z-50 min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-[280px] overflow-y-auto",
              "bg-white rounded-xl border border-gray-100 shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              "motion-reduce:animate-none"
            )}
            sideOffset={4}
            align="start"
          >
            {options.map((option) => (
              <DropdownMenu.Item
                key={option.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-base text-gray-900 cursor-pointer",
                  "outline-none select-none",
                  "data-[highlighted]:bg-gray-50",
                  "transition-colors"
                )}
                onSelect={() => onValueChange(option.value)}
              >
                {option.icon && (
                  <span className="flex-shrink-0">{option.icon}</span>
                )}
                <span className="flex-1 truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 flex-shrink-0 text-blue-500" />
                )}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  }
);

Selector.displayName = "Selector";

export { Selector };
export type { SelectorOption, SelectorProps };
