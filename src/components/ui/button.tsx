import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "border border-[#1769e0] bg-[#1769e0] text-white shadow-[0_1px_2px_rgba(23,105,224,0.2)] hover:border-[#0f55bf] hover:bg-[#0f55bf] focus-visible:ring-[#1769e0]",
  secondary:
    "border border-[#c9d4e0] bg-white text-[#344054] hover:border-[#9eb4ce] hover:bg-[#f7faff] focus-visible:ring-[#7ba8e8]",
  ghost: "border border-transparent text-[#475467] hover:bg-[#eaf2ff] hover:text-[#0f55bf]",
  danger:
    "border border-[#e8b5b0] bg-white text-[#b42318] hover:bg-[#fdf0ef] focus-visible:ring-[#b42318]",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[8px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-sm",
        className,
      )}
      {...props}
    />
  );
}
