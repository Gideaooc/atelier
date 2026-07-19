import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[11px] border border-[#dbe2ea] bg-white shadow-[0_1px_3px_rgba(16,24,40,0.05)]",
        className,
      )}
      {...props}
    />
  );
}
