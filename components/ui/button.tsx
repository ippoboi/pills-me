import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { HugeiconsIcon, HugeiconsIconProps } from "@hugeicons/react";
import { ChevronRight } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-blue-50 text-blue-600 hover:bg-blue-100",
        tertiary: "bg-gray-200 text-gray-600 hover:bg-gray-300",
        ghost: "bg-white text-blue-600 hover:bg-blue-50",
        outline: "border border-gray-200 bg-white hover:bg-gray-50",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        "destructive-secondary": "bg-red-50 hover:bg-red-100 text-red-600",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2",
        "default-no-icon": "h-10 px-3",
        "width-fit-default": "h-10 px-2.5",
        "width-fit-sm": "h-9 px-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  icon?: HugeiconsIconProps["icon"];
  rightIcon?: HugeiconsIconProps["icon"];
}

const MOTION_BUTTON_OMIT = [
  "onDrag",
  "onDragStart",
  "onDragEnd",
  "onDragEnter",
  "onDragLeave",
  "onDragOver",
] as const;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      rightIcon,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const motionProps = MOTION_BUTTON_OMIT.reduce(
      (acc, key) => {
        const { [key]: _, ...rest } = acc;
        return rest;
      },
      { ...props } as Record<string, unknown>
    );

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          <span className="px-1 leading-none">{children}</span>
        </Slot>
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={{ scale: 0.97 }}
        {...motionProps}
      >
        {icon ? (
          <HugeiconsIcon
            icon={icon as HugeiconsIconProps["icon"]}
            strokeWidth={2}
            className="block size-4 flex-shrink-0"
          />
        ) : null}
        <span className="tabular-nums px-1 leading-none translate-y-[1px]">
          {children}
        </span>
        {rightIcon ? (
          <HugeiconsIcon
            icon={rightIcon as HugeiconsIconProps["icon"]}
            strokeWidth={2}
            className="block size-4 flex-shrink-0"
          />
        ) : null}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
