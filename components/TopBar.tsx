import {
  ChevronLeft,
  ChevronRight,
  MessageCircleMore,
  Plus,
  RefreshCw,
  UserRoundPen,
} from "lucide-react";

import { Avatar } from "./Avatar";
import { formatWeekRange } from "../lib/weeks";
import { type TeamMember } from "../lib/types";

export function TopBar({
  weekKey,
  pinnedMember,
  pinnedIndex,
  onPrevWeek,
  onNextWeek,
  onOpenPin,
  onOpenMemberForm,
  onOpenContentForm,
  onSync,
  onConnectTelegram,
  onRefreshPinnedMember,
}: {
  weekKey: string;
  pinnedMember: TeamMember | null;
  pinnedIndex: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onOpenPin: () => void;
  onOpenMemberForm: () => void;
  onOpenContentForm: () => void;
  onSync: () => void;
  onConnectTelegram: () => void;
  onRefreshPinnedMember: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Traideas
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Traideas Content Pipeline
          </h1>
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-950 px-2 py-2 text-white shadow-lg shadow-slate-950/10">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
              onClick={onPrevWeek}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-52 px-3 text-center text-sm font-medium sm:min-w-64">
              {formatWeekRange(weekKey)}
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10"
              onClick={onNextWeek}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {pinnedMember ? (
              <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-3 py-2">
                <Avatar initials={pinnedMember.initials} index={pinnedIndex} size="sm" />
                <div>
                  <p className="text-xs text-slate-500">Pinned identity</p>
                  <p className="text-sm font-semibold text-slate-800">{pinnedMember.name}</p>
                  <p className="text-xs text-slate-500">
                    Telegram:{" "}
                    <span
                      className={
                        pinnedMember.telegram_chat_id ? "font-semibold text-green-700" : "font-semibold text-amber-700"
                      }
                    >
                      {pinnedMember.telegram_chat_id
                        ? pinnedMember.telegram_username
                          ? `Connected as @${pinnedMember.telegram_username}`
                          : "Connected"
                        : "Not connected"}
                    </span>
                  </p>
                </div>
                <button
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-white"
                  onClick={onOpenPin}
                  type="button"
                >
                  Change
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-200 px-3 py-1 text-sm font-medium text-cyan-800 transition hover:bg-cyan-50"
                  onClick={onConnectTelegram}
                  type="button"
                >
                  <MessageCircleMore className="h-4 w-4" />
                  {pinnedMember.telegram_chat_id ? "Reconnect Telegram" : "Connect Telegram"}
                </button>
                <button
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700 transition hover:bg-white"
                  onClick={onRefreshPinnedMember}
                  type="button"
                >
                  Refresh
                </button>
              </div>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                onClick={onOpenPin}
                type="button"
              >
                <UserRoundPen className="h-4 w-4" />
                Set your identity
              </button>
            )}

            <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50"
              onClick={onSync}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Sync
            </button>
            {/* <button
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-cyan-200 hover:bg-cyan-50"
              onClick={onOpenMemberForm}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Member
            </button> */}
            <button
              className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700"
              onClick={onOpenContentForm}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Content
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
