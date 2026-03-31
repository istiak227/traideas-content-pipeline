import { Sparkles } from "lucide-react";

import { Avatar } from "./Avatar";
import { BOARD_COLUMNS, CONTENT_TYPES, type ContentItem, type TeamMember } from "../lib/types";

function typeLabel(type: ContentItem["type"]) {
  return CONTENT_TYPES.find((item) => item.key === type)?.label ?? "Untyped";
}

export function BoardTab({
  contents,
  membersById,
  memberIndexes,
  onSelectContent,
  pinnedMemberId,
}: {
  contents: ContentItem[];
  membersById: Record<string, TeamMember>;
  memberIndexes: Record<string, number>;
  onSelectContent: (content: ContentItem) => void;
  pinnedMemberId: string | null;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[1040px] gap-4 xl:grid-cols-7">
        {BOARD_COLUMNS.map((column) => (
          <div
            key={column.key}
            className="rounded-[24px] border border-slate-200 bg-white p-4"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {column.label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {contents.filter((content) => content.status === column.key).length}
              </p>
            </div>
            <div className="space-y-3">
              {contents
                .filter((content) => content.status === column.key)
                .map((content) => {
                  const member = membersById[content.member_id];
                  const isPinned = member?.id === pinnedMemberId;
                  return (
                    <button
                      key={content.id}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isPinned
                          ? "border-cyan-300 bg-cyan-50 shadow-[0_10px_30px_-20px_rgba(8,145,178,0.9)]"
                          : "border-slate-200 bg-slate-50 hover:border-cyan-300 hover:bg-cyan-50"
                      }`}
                      onClick={() => onSelectContent(content)}
                      type="button"
                    >
                      {isPinned ? (
                        <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-cyan-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                          <Sparkles className="h-3 w-3" />
                          Your content
                        </span>
                      ) : null}
                      <p className="font-semibold text-slate-900">
                        {content.title || <span className="italic text-slate-400">no title</span>}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        {member ? (
                          <Avatar
                            initials={member.initials}
                            index={memberIndexes[member.id] ?? 0}
                            size="sm"
                          />
                        ) : null}
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {member?.name.split(" ")[0] ?? "Unknown"}
                          </p>
                          {content.type ? (
                            <p className="text-xs text-slate-500">{typeLabel(content.type)}</p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
