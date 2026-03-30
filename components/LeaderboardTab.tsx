import { Avatar } from "./Avatar";
import { CONTENT_TYPES, type LeaderboardRow, type TeamMember } from "../lib/types";

export function LeaderboardTab({
  rows,
  membersById,
  memberIndexes,
}: {
  rows: LeaderboardRow[];
  membersById: Record<string, TeamMember>;
  memberIndexes: Record<string, number>;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
      <table className="min-w-[1100px] w-full">
        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <th className="px-5 py-4">Rank</th>
            <th className="px-5 py-4">Member</th>
            <th className="px-5 py-4">Total completed</th>
            <th className="px-5 py-4">In progress</th>
            <th className="px-5 py-4">Active weeks</th>
            <th className="px-5 py-4">Top format</th>
            {CONTENT_TYPES.filter((item) => item.key !== "other").map((type) => (
              <th key={type.key} className="px-5 py-4">
                {type.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const member = membersById[row.member_id];
            return (
              <tr key={row.member_id} className="border-b border-slate-100 last:border-b-0">
                <td className="px-5 py-5 text-lg font-semibold text-slate-400">#{index + 1}</td>
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    {member ? (
                      <Avatar
                        initials={member.initials}
                        index={memberIndexes[member.id] ?? 0}
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold text-slate-900">{member?.name ?? "Unknown"}</p>
                      <p className="text-sm text-slate-500">{member?.initials ?? "--"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 text-3xl font-semibold text-green-600">
                  {row.totalCompleted}
                </td>
                <td className="px-5 py-5 text-lg font-semibold text-sky-600">
                  {row.inProgress}
                </td>
                <td className="px-5 py-5 text-lg font-semibold text-slate-800">
                  {row.activeWeeks}
                </td>
                <td className="px-5 py-5 text-sm font-semibold text-slate-700">
                  {row.topFormat}
                </td>
                {CONTENT_TYPES.filter((item) => item.key !== "other").map((type) => (
                  <td
                    key={type.key}
                    className="px-5 py-5 text-center text-sm font-semibold text-slate-700"
                  >
                    {row.typeCounts[type.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

