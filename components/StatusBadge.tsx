import type { ComponentType } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Globe,
  PenLine,
  RotateCcw,
} from "lucide-react";

import { STATUS_LABELS, type ContentStatus } from "../lib/types";

const statusStyles: Record<ContentStatus, string> = {
  pending_title: "bg-amber-100 text-amber-800 ring-amber-200",
  title_submitted: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  writing: "bg-sky-100 text-sky-800 ring-sky-200",
  content_submitted: "bg-orange-100 text-orange-800 ring-orange-200",
  revision: "bg-rose-100 text-rose-800 ring-rose-200",
  final: "bg-green-100 text-green-800 ring-green-200",
  scheduled: "bg-teal-100 text-teal-800 ring-teal-200",
  published: "bg-slate-200 text-slate-700 ring-slate-300",
};

const statusIcons: Record<ContentStatus, ComponentType<{ className?: string }>> = {
  pending_title: Clock3,
  title_submitted: FileText,
  writing: PenLine,
  content_submitted: Eye,
  revision: RotateCcw,
  final: CheckCircle2,
  scheduled: CalendarCheck,
  published: Globe,
};

export function StatusBadge({ status }: { status: ContentStatus }) {
  const Icon = statusIcons[status];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
