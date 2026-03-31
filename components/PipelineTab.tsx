import { MessageSquareMore, Plus, Sparkles } from "lucide-react";

import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";
import { formatDateLabel } from "../lib/weeks";
import { CONTENT_TYPES, type ContentItem, type TeamMember } from "../lib/types";

function typeLabel(type: ContentItem["type"]) {
  return CONTENT_TYPES.find((item) => item.key === type)?.label ?? "Untyped";
}

export function PipelineTab({
  members,
  memberIndexes,
  contentByMember,
  onSelectContent,
  onQuickAdd,
  pinnedMemberId,
}: {
  members: TeamMember[];
  memberIndexes: Record<string, number>;
  contentByMember: Record<string, ContentItem[]>;
  onSelectContent: (content: ContentItem) => void;
  onQuickAdd: (memberId: string) => void;
  pinnedMemberId: string | null;
}) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
      <table className="min-w-[1040px] w-full">
        <thead className="border-b border-slate-200 bg-slate-50/80">
          <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <th className="px-5 py-4">Avatar</th>
            <th className="px-5 py-4">Member</th>
            <th className="px-5 py-4">Content</th>
            <th className="px-5 py-4">Feedback</th>
            <th className="px-5 py-4">Status</th>
            <th className="px-5 py-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const items = contentByMember[member.id] ?? [];
            const isPinned = member.id === pinnedMemberId;

            return (
              <tr
                key={member.id}
                className={`border-b align-top last:border-b-0 ${
                  isPinned ? "border-cyan-200 bg-cyan-50/40" : "border-slate-100"
                }`}
              >
                <td className="px-5 py-5">
                  <Avatar
                    initials={member.initials}
                    index={memberIndexes[member.id] ?? 0}
                  />
                </td>
                <td className="px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        {isPinned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                            <Sparkles className="h-3 w-3" />
                            You
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-500">{member.initials}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-5">
                  {items.length > 0 ? (
                    <div className="space-y-4">
                      {items.map((content) => (
                        <div
                          key={content.id}
                          className={`rounded-2xl border p-4 ${
                            isPinned
                              ? "border-cyan-200 bg-white shadow-[0_18px_40px_-28px_rgba(8,145,178,0.9)]"
                              : "border-slate-200"
                          }`}
                        >
                          {content.carried ? (
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                              Continuing from{" "}
                              {formatDateLabel(content.carried_from_week_key ?? content.week_key)}
                            </p>
                          ) : null}
                          {isPinned ? (
                            <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">
                              <Sparkles className="h-3 w-3" />
                              Your content
                            </p>
                          ) : null}
                          <p className="font-semibold text-slate-900">
                            {content.title || <span className="italic text-slate-400">no title</span>}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {content.type ? (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {typeLabel(content.type)}
                              </span>
                            ) : null}
                            {content.mediums.map((medium) => (
                              <span
                                key={`${content.id}-${medium}`}
                                className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700"
                              >
                                {medium}
                              </span>
                            ))}
                          </div>
                          {content.feedback_count > 0 ? (
                            <p className="mt-3 text-sm text-slate-500">
                              {content.feedback_count} feedback note
                              {content.feedback_count === 1 ? "" : "s"}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>— no content</span>
                      <button
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={() => onQuickAdd(member.id)}
                        type="button"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-5 py-5">
                  <div className="space-y-4">
                    {items.length > 0 ? (
                      items.map((content) => (
                        <div key={content.id} className="min-h-14 rounded-2xl border border-slate-200 p-4">
                          {content.feedback_count > 0 ? (
                            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                              <MessageSquareMore className="h-4 w-4 text-cyan-700" />
                              {content.feedback_count} note
                              {content.feedback_count === 1 ? "" : "s"}
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">No notes</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No notes</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-5">
                  <div className="space-y-4">
                    {items.length > 0 ? (
                      items.map((content) => (
                        <div key={content.id} className="min-h-14">
                          <StatusBadge status={content.status} />
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-5">
                  <div className="space-y-4">
                    {items.length > 0 ? (
                      items.map((content) => (
                        <button
                          key={content.id}
                          className="inline-flex min-h-14 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                          onClick={() => onSelectContent(content)}
                          type="button"
                        >
                          View
                        </button>
                      ))
                    ) : (
                      <button
                        className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                        onClick={() => onQuickAdd(member.id)}
                        type="button"
                      >
                        Quick add
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
