import { Globe2 } from "lucide-react";

import { Avatar } from "./Avatar";
import { formatDateLabel } from "../lib/weeks";
import { CONTENT_TYPES, type ContentItem, type TeamMember } from "../lib/types";

function typeLabel(type: ContentItem["type"]) {
  return CONTENT_TYPES.find((item) => item.key === type)?.label ?? "Untyped";
}

export function PublishedTab({
  contents,
  membersById,
  memberIndexes,
  pinnedMemberId,
  onSelectContent,
}: {
  contents: ContentItem[];
  membersById: Record<string, TeamMember>;
  memberIndexes: Record<string, number>;
  pinnedMemberId: string | null;
  onSelectContent: (content: ContentItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
      <table className="w-full min-w-[980px]">
        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <th className="px-5 py-4">Member</th>
            <th className="px-5 py-4">Title</th>
            <th className="px-5 py-4">Type</th>
            <th className="px-5 py-4">Published</th>
            <th className="px-5 py-4">Mediums</th>
            <th className="px-5 py-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {contents.map((content) => {
            const member = membersById[content.member_id];
            const isPinned = member?.id === pinnedMemberId;

            return (
              <tr
                key={content.id}
                className={`border-b last:border-b-0 ${
                  isPinned ? "border-cyan-200 bg-cyan-50/40" : "border-slate-100"
                }`}
              >
                <td className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    {member ? (
                      <Avatar
                        initials={member.initials}
                        index={memberIndexes[member.id] ?? 0}
                        size="sm"
                      />
                    ) : null}
                    <div>
                      <p className="font-semibold text-slate-900">
                        {member?.name ?? "Unknown"}
                        {isPinned ? " • You" : ""}
                      </p>
                      <p className="text-sm text-slate-500">{content.week_key}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5 font-semibold text-slate-900">
                  {content.title || "Untitled"}
                </td>
                <td className="px-5 py-5 text-sm text-slate-600">{typeLabel(content.type)}</td>
                <td className="px-5 py-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    <Globe2 className="h-4 w-4" />
                    {formatDateLabel(content.publish_date || content.updated_at)}
                  </div>
                </td>
                <td className="px-5 py-5">
                  <div className="flex flex-wrap gap-2">
                    {content.mediums.length > 0 ? (
                      content.mediums.map((medium) => (
                        <span
                          key={`${content.id}-${medium}`}
                          className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700"
                        >
                          {medium}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No mediums</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-5">
                  <button
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                    onClick={() => onSelectContent(content)}
                    type="button"
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
