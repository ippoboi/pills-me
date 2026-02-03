import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        secondary: "bg-blue-50 text-blue-600 hover:bg-blue-100",
        tertiary: "bg-gray-200 text-gray-500 hover:bg-gray-300",
        outline: "border border-gray-200 bg-white hover:bg-gray-50",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        "destructive-secondary": "bg-red-50 hover:bg-red-100 text-red-600",
      },
      size: {
        default: "h-11 px-3 py-3",
        sm: "h-9 px-2 py-3",
        "default-no-icon": "h-11 px-3 py-3",
        "width-fit-default": "h-11 px-2.5",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const paddedChildren = React.Children.map(children, (child) => {
      if (typeof child === "string" || typeof child === "number") {
        return <span className="px-1">{child}</span>;
      }
      return child;
    });

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {paddedChildren}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
