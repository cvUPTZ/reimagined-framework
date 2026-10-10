import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type ButtonVariant = "default" | "quiet" | "outline" | "danger" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "icon";
}

const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary-hover",
  quiet: "bg-secondary text-secondary-foreground hover:bg-accent",
  outline: "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-accent",
  danger: "bg-destructive/15 text-destructive hover:bg-destructive/25",
  icon: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  icon: "size-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});