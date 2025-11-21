import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-500 text-white hover:bg-sky-600 focus-visible:ring-sky-200",
  secondary:
    "bg-white/80 text-slate-700 border border-sky-100 hover:bg-white focus-visible:ring-sky-200",
  ghost:
    "bg-transparent text-slate-700 hover:bg-sky-50 focus-visible:ring-sky-100",
  danger: "bg-rose-500 text-white hover:bg-rose-600 focus-visible:ring-rose-200",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = ({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  children,
  className,
  ...rest
}: ButtonProps) => (
  <button
    className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
    {...rest}
  >
    {leftIcon && <span className="text-lg">{leftIcon}</span>}
    <span>{children}</span>
    {rightIcon && <span className="text-lg">{rightIcon}</span>}
  </button>
);

