"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Globe,
  MessageSquare,
  PenLine,
  RotateCcw,
  Save,
  Send,
  X,
} from "lucide-react";

import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";
import { CONTENT_TYPES, PUBLISHING_MEDIUMS, type ContentItem, type ContentStatus, type TeamMember } from "../lib/types";
import { formatDateLabel, formatWeekRange } from "../lib/weeks";

type Draft = {
  title: string;
  type: ContentItem["type"];
  mediums: string[];
  link_post: string;
  link_doc: string;
  link_file: string;
};

const stageActions: Record<
  ContentStatus,
  Array<{
    label: string;
    status: ContentStatus;
    icon: ComponentType<{ className?: string }>;
    className: string;
  }>
> = {
  pending_title: [
    {
      label: "Submit title",
      status: "title_submitted",
      icon: ArrowRight,
      className: "bg-amber-500 text-white hover:bg-amber-600",
    },
  ],
  title_submitted: [
    {
      label: "Start writing",
      status: "writing",
      icon: PenLine,
      className: "bg-sky-600 text-white hover:bg-sky-700",
    },
  ],
  writing: [
    {
      label: "Submit for review",
      status: "content_submitted",
      icon: Send,
      className: "bg-orange-500 text-white hover:bg-orange-600",
    },
  ],
  content_submitted: [
    {
      label: "Request revision",
      status: "revision",
      icon: RotateCcw,
      className: "border border-rose-200 text-rose-700 hover:bg-rose-50",
    },
    {
      label: "Mark as final",
      status: "final",
      icon: CheckCircle2,
      className: "bg-green-600 text-white hover:bg-green-700",
    },
  ],
  revision: [
    {
      label: "Submit for review",
      status: "content_submitted",
      icon: Send,
      className: "bg-orange-500 text-white hover:bg-orange-600",
    },
  ],
  final: [],
  scheduled: [
    {
      label: "Mark published",
      status: "published",
      icon: Globe,
      className: "bg-slate-800 text-white hover:bg-slate-900",
    },
  ],
  published: [],
};

export function DetailPanel({
  content,
  member,
  memberIndex,
  pinnedMember,
  onClose,
  onSave,
  onAddFeedback,
  onMoveStage,
  onSchedule,
}: {
  content: ContentItem;
  member: TeamMember | null;
  memberIndex: number;
  pinnedMember: TeamMember | null;
  onClose: () => void;
  onSave: (values: Draft) => Promise<void>;
  onAddFeedback: (values: { reviewerName: string; note: string }) => Promise<void>;
  onMoveStage: (status: ContentStatus) => Promise<void>;
  onSchedule: (date: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>({
    title: content.title,
    type: content.type,
    mediums: content.mediums,
    link_post: content.link_post,
    link_doc: content.link_doc,
    link_file: content.link_file,
  });
  const [reviewerName, setReviewerName] = useState(pinnedMember?.name ?? "");
  const [note, setNote] = useState("");
  const [scheduleDate, setScheduleDate] = useState(content.publish_date || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({
      title: content.title,
      type: content.type,
      mediums: content.mediums,
      link_post: content.link_post,
      link_doc: content.link_doc,
      link_file: content.link_file,
    });
    setReviewerName(pinnedMember?.name ?? "");
    setNote("");
    setScheduleDate(content.publish_date || "");
  }, [content, pinnedMember]);

  const typeHint = useMemo(
    () => CONTENT_TYPES.find((item) => item.key === draft.type)?.hint,
    [draft.type],
  );

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {member ? <Avatar initials={member.initials} index={memberIndex} size="lg" /> : null}
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{member?.name ?? "Unknown"}</h2>
            <p className="text-sm text-slate-500">{formatWeekRange(content.week_key)}</p>
          </div>
          <StatusBadge status={content.status} />
        </div>
        <button
          className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-center"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Editable fields
            </h3>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                placeholder="Content title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
              />

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  value={draft.type}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      type: event.target.value as ContentItem["type"],
                    }))
                  }
                >
                  <option value="">Select content type</option>
                  {CONTENT_TYPES.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  {typeHint ?? "Word count hint"}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">Publishing mediums</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PUBLISHING_MEDIUMS.map((medium) => {
                    const active = draft.mediums.includes(medium);
                    return (
                      <button
                        key={medium}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-cyan-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"
                        }`}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            mediums: active
                              ? current.mediums.filter((item) => item !== medium)
                              : [...current.mediums, medium],
                          }))
                        }
                        type="button"
                      >
                        {medium}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4">
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="Post link"
                  value={draft.link_post}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, link_post: event.target.value }))
                  }
                />
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="Doc link"
                  value={draft.link_doc}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, link_doc: event.target.value }))
                  }
                />
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                  placeholder="File link"
                  value={draft.link_file}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, link_file: event.target.value }))
                  }
                />
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSave(draft);
                  } finally {
                    setSaving(false);
                  }
                }}
                type="button"
              >
                <Save className="h-4 w-4" />
                Save changes
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {content.feedback_count} feedback note{content.feedback_count === 1 ? "" : "s"}
            </h3>
            <div className="mt-4 space-y-3">
              {content.feedback.length > 0 ? (
                content.feedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="rounded-2xl border-l-4 border-cyan-500 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {feedback.reviewer_name}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateLabel(feedback.created_at)}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
                      {feedback.note}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No feedback yet</p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Add feedback
            </h3>
            <div className="mt-4 space-y-4">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                placeholder="Reviewer name"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
              />
              <textarea
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
                placeholder="Add review note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
              <button
                className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!reviewerName.trim() || !note.trim()}
                onClick={async () => {
                  await onAddFeedback({ reviewerName, note });
                  setNote("");
                }}
                type="button"
              >
                <MessageSquare className="h-4 w-4" />
                Add note
              </button>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Move to next stage
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {stageActions[content.status].length > 0 ? (
                stageActions[content.status].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={`${content.id}-${action.status}`}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${action.className}`}
                      onClick={() => onMoveStage(action.status)}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">
                  No direct stage move available from this status.
                </p>
              )}
            </div>
          </div>

          {content.status === "final" ? (
            <div className="rounded-[24px] border border-teal-200 bg-teal-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
                Schedule
              </h3>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  className="rounded-2xl border border-teal-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-400"
                  type="date"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                />
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!scheduleDate}
                  onClick={() => onSchedule(scheduleDate)}
                  type="button"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Schedule
                </button>
              </div>
            </div>
          ) : null}

          {content.publish_date ? (
            <div className="rounded-[24px] border border-green-200 bg-green-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                Publish date
              </p>
              <p className="mt-2 text-base font-semibold text-green-900">
                Scheduled for {formatDateLabel(content.publish_date)}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
