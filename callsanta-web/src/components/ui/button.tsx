import { cn } from "@/lib/utils";
import React, { forwardRef, ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const getInlineStyles = (): React.CSSProperties => {
      switch (variant) {
        case "primary":
          return { backgroundColor: '#C41E3A', color: 'white' };
        case "secondary":
          return { backgroundColor: '#165B33', color: 'white' };
        case "ghost":
          return { color: '#165B33' };
        case "outline":
          return { borderColor: '#C41E3A', color: '#C41E3A' };
        default:
          return {};
      }
    };

    return (
      <button
        ref={ref}
        style={getInlineStyles()}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "hover:opacity-90 focus:ring-red-400 shadow-lg hover:shadow-xl":
              variant === "primary",
            "hover:opacity-90 focus:ring-green-400 shadow-lg hover:shadow-xl":
              variant === "secondary",
            "border-2 border-current bg-transparent hover:bg-gray-100 focus:ring-gray-400":
              variant === "outline",
            "hover:bg-gray-100 focus:ring-gray-400":
              variant === "ghost",
          },
          {
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-base": size === "md",
            "px-8 py-4 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
