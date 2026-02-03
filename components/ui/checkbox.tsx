"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02FreeIcons } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

type HugeiconSymbol = Parameters<typeof HugeiconsIcon>[0]["icon"];

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "checked"
  > {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  icon?: HugeiconSymbol;
  iconClassName?: string;
  strokeWidth?: number;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      onCheckedChange,
      icon = Tick02FreeIcons,
      iconClassName = "w-4 h-4 text-white",
      strokeWidth = 2,
      disabled,
      className,
      onChange,
      ...inputProps
    },
    ref
  ) => {
    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] transition-colors duration-150",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className
        )}
      >
        <input
          {...inputProps}
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => {
            onCheckedChange?.(event.target.checked);
            onChange?.(event);
          }}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-lg border transition-all duration-200",
            checked
              ? "border-blue-600 bg-blue-600"
              : "border-gray-300 bg-white hover:border-gray-400",
            disabled && "pointer-events-none"
          )}
        >
          {checked && (
            <HugeiconsIcon
              icon={icon}
              strokeWidth={strokeWidth}
              className={iconClassName}
            />
          )}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
