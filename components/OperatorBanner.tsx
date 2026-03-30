import { RefreshCw } from "lucide-react";

import { Avatar } from "./Avatar";
import { type TeamMember } from "../lib/types";

export function OperatorBanner({
  member,
  memberIndex,
  onReassign,
  poolCount,
}: {
  member: TeamMember | null;
  memberIndex: number;
  onReassign: () => void;
  poolCount: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-cyan-200 bg-linear-to-r from-cyan-100 via-sky-50 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {member ? <Avatar initials={member.initials} index={memberIndex} size="lg" /> : null}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700">
            Weekly operator
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {member?.name ?? "Unassigned this week"}
          </p>
          <p className="text-sm text-slate-600">
            Operator stays fixed for the week until you assign or reassign it.
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Eligible operator pool: {poolCount}
          </p>
        </div>
      </div>

      <button
        className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50 sm:self-center"
        onClick={onReassign}
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
        {member ? "Reassign randomly" : "Assign randomly"}
      </button>
    </div>
  );
}
