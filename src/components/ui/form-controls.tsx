import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const control =
  "block w-full min-w-0 rounded-[8px] border border-[#c9d4e0] bg-white px-3 text-sm text-[#152238] shadow-[0_1px_1px_rgba(16,24,40,0.025)] outline-none placeholder:text-[#98a2b3] hover:border-[#aabbd0] focus:border-[#1769e0] focus:ring-3 focus:ring-[#d9e8ff] disabled:bg-[#f1f4f7] disabled:text-[#667085]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, "h-10", className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(control, "min-h-24 resize-y py-2.5", className)}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cn(control, "h-10 pr-9", className)} {...props} />;
  },
);

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[#344054]">
      {children}
    </label>
  );
}

export function Checkbox({
  checked,
  onChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex items-center gap-2", disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer", className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="grid size-5 shrink-0 place-items-center rounded-[5px] border-2 border-[#91a4ba] bg-white shadow-sm peer-focus-visible:ring-3 peer-focus-visible:ring-[#d9e8ff] peer-checked:border-[#1769e0] peer-checked:bg-[#1769e0]">
        {checked ? <Check className="size-3.5 stroke-[3] text-white" /> : null}
      </span>
      <span className="sr-only">{label}</span>
    </label>
  );
}
