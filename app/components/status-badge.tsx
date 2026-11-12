import { cn } from "@/lib/utils";

export type BadgeStatus = "live" | "scheduled" | "expired" | "disabled";

const STYLES: Record<BadgeStatus, string> = {
  live: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-600/20",
  expired: "bg-amber-50 text-amber-800 ring-amber-600/20",
  disabled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const LABELS: Record<BadgeStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  expired: "Expired",
  disabled: "Disabled",
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[status]
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {LABELS[status]}
    </span>
  );
}
