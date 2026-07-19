import { cn } from "@/lib/utils";

const styles = {
  OPEN: "border-[#d0d5dd] bg-[#f8fafb] text-[#475467]",
  IN_PROGRESS: "border-[#b9d2f6] bg-[#eaf2ff] text-[#1769e0]",
  COMPLETED: "border-[#b9ddca] bg-[#edf7f1] text-[#287a52]",
} as const;

const labels = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em produção",
  COMPLETED: "Concluído",
} as const;

export function StatusBadge({ status }: { status: keyof typeof styles }) {
  return (
    <span className={cn("inline-flex rounded-[5px] border px-2 py-0.5 text-xs font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-[#e7ebef]", className)}>
      <div
        className="h-full rounded-full bg-[#1769e0] transition-all"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}
