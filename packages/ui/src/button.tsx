import { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "success";

type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  outline: "border border-hairline bg-surface text-ink hover:border-search-border hover:bg-hover",
  ghost: "text-secondary hover:bg-hover hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90",
  success: "bg-success text-white hover:opacity-90",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3.5 text-xs",
  md: "h-10 gap-2 px-5 text-sm",
};

export const Button = ({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  children,
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
