import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const variantStyles = {
  category: "bg-sky-50 text-slate-700",
  project: "bg-sun-50 text-slate-700",
  trait: "bg-mist-100 text-slate-700",
  neutral: "bg-white/70 text-slate-600 border border-sky-100",
} as const;

export type TagVariant = keyof typeof variantStyles;

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  variant?: TagVariant;
}

export const Tag = ({
  icon,
  children,
  className,
  variant = "neutral",
  ...rest
}: TagProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
      variantStyles[variant],
      className,
    )}
    {...rest}
  >
    {icon && <span className="text-sm leading-none">{icon}</span>}
    {children}
  </span>
);

