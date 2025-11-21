import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export const Card = ({
  title,
  description,
  actions,
  children,
  className,
  ...rest
}: CardProps) => (
  <div
    className={cn(
      "card relative overflow-hidden border border-white/50 bg-white/80 p-6 shadow-soft",
      className,
    )}
    {...rest}
  >
    {(title || actions) && (
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {typeof title === "string" ? (
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          ) : (
            title
          )}
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        {actions}
      </div>
    )}
    {children}
  </div>
);

