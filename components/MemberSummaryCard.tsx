import { ArrowRight, Sparkles } from "lucide-react";

import { StatusBadge } from "./StatusBadge";
import { type ContentItem, type TeamMember } from "../lib/types";
import { formatDateLabel } from "../lib/weeks";

function getNextAction(content: ContentItem | null) {
  if (!content) {
    return "You do not have an active content item this week yet.";
  }

  switch (content.status) {
    case "pending_title":
      return "Your next step is to submit a title for this week.";
    case "title_submitted":
      return "Your title is in. Start writing the full content.";
    case "writing":
      return "Keep writing and submit the draft for review when ready.";
    case "content_submitted":
      return "Your draft is under review. Watch for feedback.";
    case "revision":
      return "Changes were requested. Review feedback and update the draft.";
    case "final":
      return "Your content is approved and ready to be scheduled.";
    case "scheduled":
      return "Your content is scheduled. You can prepare the next one after publishing.";
    case "published":
      return "This content is published.";
  }
}

export function MemberSummaryCard({
  member,
  content,
  onOpenContent,
}: {
  member: TeamMember | null;
  content: ContentItem | null;
  onOpenContent: (content: ContentItem) => void;
}) {
  if (!member) {
    return (
      <div className="rounded-[24px] border border-dashed border-cyan-200 bg-cyan-50/70 p-5 text-sm text-cyan-900">
        Set your identity to see your personal weekly summary and find your content faster.
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-cyan-200 bg-[linear-gradient(135deg,_rgba(236,254,255,0.95),_rgba(255,255,255,0.98))] p-5 shadow-[0_24px_80px_-40px_rgba(8,145,178,0.45)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white">
            <Sparkles className="h-3.5 w-3.5" />
            My week
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{member.name}</p>
            <p className="mt-1 text-sm text-slate-600">
              Each writer has one active content at a time. If it is not finished, it carries forward into the next week instead of creating a second assignment.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/80 p-4 lg:min-w-[20rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            This week
          </p>
          {content ? (
            <div className="mt-3 space-y-3">
              {content.carried ? (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Continuing from {formatDateLabel(content.carried_from_week_key ?? content.week_key)}
                </p>
              ) : null}
              <p className="text-base font-semibold text-slate-900">
                {content.title || <span className="italic text-slate-400">no title yet</span>}
              </p>
              <StatusBadge status={content.status} />
              <p className="text-sm text-slate-600">{getNextAction(content)}</p>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                onClick={() => onOpenContent(content)}
                type="button"
              >
                <ArrowRight className="h-4 w-4" />
                Open my content
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">{getNextAction(null)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
