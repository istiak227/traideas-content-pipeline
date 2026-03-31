"use client";

import { useEffect, useRef, useState } from "react";

import { AddContentForm } from "../components/AddContentForm";
import { BoardTab } from "../components/BoardTab";
import { CalendarStrip } from "../components/CalendarStrip";
import { DetailPanel } from "../components/DetailPanel";
import { LeaderboardTab } from "../components/LeaderboardTab";
import { MemberLoginCard } from "../components/MemberLoginCard";
import { MemberSummaryCard } from "../components/MemberSummaryCard";
import { OperatorBanner } from "../components/OperatorBanner";
import { PipelineTab } from "../components/PipelineTab";
import { PublishedTab } from "../components/PublishedTab";
import { StatCards } from "../components/StatCards";
import { TopBar } from "../components/TopBar";
import { addWeeks, getCurrentWeekKey } from "../lib/weeks";
import {
  CONTENT_TYPES,
  type AuthSession,
  type ContentItem,
  type ContentStatus,
  type LeaderboardRow,
  type TeamMember,
} from "../lib/types";

type OperatorResponse = {
  operator: {
    week_key: string;
    member_id: string;
    member: TeamMember | null;
  } | null;
};

type MemberLoginResponse =
  | {
      step: "connect_telegram";
      deep_link: string;
      expires_at: string;
      member: { id: string; name: string; username: string };
    }
  | {
      step: "enter_code";
      expires_at: string;
      member: { id: string; name: string; username: string };
    };

async function parseJson<T>(response: Response) {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as
      | { error?: string; details?: string }
      | null;
    throw new Error(error?.details ? `${error.error}\n${error.details}` : error?.error || "Request failed.");
  }

  return (await response.json()) as T;
}

export default function Home() {
  const [weekKey, setWeekKey] = useState(() => getCurrentWeekKey());
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [allContents, setAllContents] = useState<ContentItem[]>([]);
  const [operator, setOperator] = useState<TeamMember | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [tab, setTab] = useState<"pipeline" | "board" | "published" | "leaderboard">("pipeline");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [showAddContent, setShowAddContent] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginStep, setLoginStep] = useState<"username" | "connect_telegram" | "enter_code">(
    "username",
  );
  const [loginDeepLink, setLoginDeepLink] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginStatusMessage, setLoginStatusMessage] = useState("");
  const detailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const sessionJson = await parseJson<{ session: AuthSession | null }>(
          await fetch("/api/auth/session", { cache: "no-store" }),
        );

        if (cancelled) {
          return;
        }

        setSession(sessionJson.session);

        if (!sessionJson.session || sessionJson.session.role !== "member" || !sessionJson.session.member) {
          setMembers([]);
          setContents([]);
          setAllContents([]);
          setOperator(null);
          return;
        }

        const [membersJson, weekContentsJson, allContentsJson, operatorJson] =
          await Promise.all([
            parseJson<{ members: TeamMember[] }>(await fetch("/api/members")),
            parseJson<{ contents: ContentItem[] }>(
              await fetch(`/api/contents?week_key=${encodeURIComponent(weekKey)}`),
            ),
            parseJson<{ contents: ContentItem[] }>(await fetch("/api/contents")),
            parseJson<OperatorResponse>(
              await fetch(`/api/operators?week_key=${encodeURIComponent(weekKey)}`),
            ),
          ]);

        if (cancelled) {
          return;
        }

        setMembers(membersJson.members);
        setContents(weekContentsJson.contents);
        setAllContents(allContentsJson.contents);
        setOperator(operatorJson.operator?.member ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [refreshTick, weekKey]);

  useEffect(() => {
    if (!selectedContentId) {
      return;
    }

    const stillExists = allContents.some((item) => item.id === selectedContentId);
    if (!stillExists) {
      setSelectedContentId(null);
    }
  }, [allContents, selectedContentId]);

  useEffect(() => {
    if (!selectedContentId || !detailRef.current) {
      return;
    }

    detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedContentId]);

  const currentMember = session?.role === "member" ? session.member : null;
  const membersById = Object.fromEntries(members.map((member) => [member.id, member]));
  const memberIndexes = Object.fromEntries(members.map((member, index) => [member.id, index]));
  const contentWriters = members.filter((member) => member.is_content_writer === 1);
  const operatorPool = members.filter((member) => member.is_operator_eligible === 1);
  const weekPipelineContents = contents.filter((content) => content.status !== "published");
  const contentByMember = contentWriters.reduce<Record<string, ContentItem[]>>((acc, member) => {
    acc[member.id] = weekPipelineContents.filter((content) => content.member_id === member.id);
    return acc;
  }, {});
  const publishedContents = allContents
    .filter((content) => content.status === "published")
    .sort((a, b) => (b.publish_date || b.updated_at).localeCompare(a.publish_date || a.updated_at));
  const selectedContent = allContents.find((content) => content.id === selectedContentId) ?? null;
  const currentMemberContent = currentMember
    ? (contentByMember[currentMember.id] ?? []).sort((a, b) => {
        if (a.carried !== b.carried) {
          return b.carried - a.carried;
        }

        return a.created_at.localeCompare(b.created_at);
      })[0] ?? null
    : null;

  const stats = {
    awaitingReview: weekPipelineContents.filter((content) => content.status === "content_submitted").length,
    inProgress: weekPipelineContents.filter((content) =>
      ["title_submitted", "writing", "revision"].includes(content.status),
    ).length,
    titlePending: weekPipelineContents.filter((content) => content.status === "pending_title").length,
    completed: weekPipelineContents.filter((content) =>
      ["final", "scheduled"].includes(content.status),
    ).length,
  };

  const leaderboardRows: LeaderboardRow[] = contentWriters
    .map((member) => {
      const memberContents = allContents.filter((content) => content.member_id === member.id);
      const typeCounts = CONTENT_TYPES.reduce(
        (acc, type) => ({ ...acc, [type.key]: 0 }),
        {} as LeaderboardRow["typeCounts"],
      );

      const activeWeeks = new Set<string>();
      let totalCompleted = 0;
      let inProgress = 0;

      for (const content of memberContents) {
        if (content.type) {
          typeCounts[content.type] += 1;
        }

        if (["final", "scheduled", "published"].includes(content.status)) {
          totalCompleted += 1;
          activeWeeks.add(content.week_key);
        }

        if (
          ["title_submitted", "writing", "content_submitted", "revision"].includes(content.status)
        ) {
          inProgress += 1;
        }
      }

      const topEntry = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0] ?? ["other", 0];

      return {
        member_id: member.id,
        totalCompleted,
        inProgress,
        activeWeeks: activeWeeks.size,
        topFormat: CONTENT_TYPES.find((type) => type.key === topEntry[0])?.label ?? "None yet",
        typeCounts,
      };
    })
    .sort(
      (a, b) =>
        b.totalCompleted - a.totalCompleted ||
        b.inProgress - a.inProgress ||
        b.activeWeeks - a.activeWeeks,
    );

  async function refresh() {
    setRefreshTick((current) => current + 1);
  }

  async function requestMemberLoginCode() {
    setLoginLoading(true);
    setLoginError("");
    setLoginStatusMessage("");

    try {
      const result = await parseJson<MemberLoginResponse>(
        await fetch("/api/auth/member/request-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: loginUsername.trim() }),
        }),
      );

      if (result.step === "connect_telegram") {
        setLoginStep("connect_telegram");
        setLoginDeepLink(result.deep_link);
        setLoginStatusMessage(
          `Connect Telegram for @${result.member.username}. This link expires at ${result.expires_at}.`,
        );
        return;
      }

      setLoginStep("enter_code");
      setLoginDeepLink("");
      setLoginStatusMessage(
        `A one-time login code was sent to Telegram for @${result.member.username}.`,
      );
    } catch (requestError) {
      setLoginError(requestError instanceof Error ? requestError.message : "Unable to continue login.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function verifyMemberLoginCode() {
    setLoginLoading(true);
    setLoginError("");
    setLoginStatusMessage("");

    try {
      await parseJson(
        await fetch("/api/auth/member/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: loginUsername.trim(),
            code: loginCode.trim(),
          }),
        }),
      );

      setLoginCode("");
      setLoginStep("username");
      await refresh();
    } catch (verifyError) {
      setLoginError(verifyError instanceof Error ? verifyError.message : "Unable to verify code.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function logout() {
    await parseJson(
      await fetch("/api/auth/logout", {
        method: "POST",
      }),
    );
    setSession(null);
    setMembers([]);
    setContents([]);
    setAllContents([]);
    setOperator(null);
    setSelectedContentId(null);
    setShowAddContent(false);
    setLoginCode("");
    setLoginStep("username");
    setStatusMessage("");
    setError("");
    await refresh();
  }

  async function connectCurrentMemberTelegram() {
    if (!currentMember) {
      setError("Sign in first, then connect Telegram.");
      return;
    }

    const result = await parseJson<{ deep_link: string; expires_at: string }>(
      await fetch("/api/telegram/connect-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: currentMember.id }),
      }),
    );

    window.open(result.deep_link, "_blank", "noopener,noreferrer");
    setStatusMessage(
      `Open Telegram, press Start, then come back here. Link expires at ${result.expires_at}.`,
    );
  }

  async function patchContent(id: string, body: Partial<ContentItem>) {
    await parseJson<{ content: ContentItem }>(
      await fetch(`/api/contents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    await refresh();
  }

  async function syncCurrentWeek() {
    await parseJson(
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_key: weekKey }),
      }),
    );
    await refresh();
  }

  async function reassignOperator() {
    if (operatorPool.length === 0) {
      setError("No members are enabled for the operator pool. Update toggles in /member first.");
      return;
    }

    const eligible = operatorPool.filter((member) => member.id !== operator?.id);
    const pool = eligible.length > 0 ? eligible : operatorPool;
    const randomMember = pool[Math.floor(Math.random() * pool.length)];

    await parseJson<OperatorResponse>(
      await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_key: weekKey,
          member_id: randomMember.id,
        }),
      }),
    );
    await refresh();
  }

  async function handleQuickAdd(memberId: string) {
    const result = await parseJson<{ content: ContentItem }>(
      await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, week_key: weekKey, title: "" }),
      }),
    );
    setSelectedContentId(result.content.id);
    await refresh();
  }

  if (loading && !currentMember) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_52%,_#eef3f8_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full rounded-[24px] border border-slate-200 bg-white px-5 py-16 text-center text-sm font-medium text-slate-500">
            Loading Traideas Content Pipeline...
          </div>
        </div>
      </main>
    );
  }

  if (!currentMember) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_52%,_#eef3f8_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-4 py-6 sm:px-6 lg:px-8">
          <MemberLoginCard
            code={loginCode}
            deepLink={loginDeepLink}
            error={loginError}
            loading={loginLoading}
            onCodeChange={setLoginCode}
            onRequestCode={requestMemberLoginCode}
            onUsernameChange={setLoginUsername}
            onVerifyCode={verifyMemberLoginCode}
            statusMessage={loginStatusMessage}
            step={loginStep}
            username={loginUsername}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.2),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#f5f7fb_52%,_#eef3f8_100%)]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <TopBar
          weekKey={weekKey}
          currentMember={currentMember}
          currentMemberIndex={memberIndexes[currentMember.id] ?? 0}
          onPrevWeek={() => setWeekKey((current) => addWeeks(current, -1))}
          onNextWeek={() => setWeekKey((current) => addWeeks(current, 1))}
          onOpenContentForm={() => setShowAddContent((current) => !current)}
          onSync={() => void syncCurrentWeek()}
          onConnectTelegram={() => void connectCurrentMemberTelegram()}
          onRefreshCurrentMember={() => void refresh()}
          onLogout={() => void logout()}
        />

        <MemberSummaryCard
          member={currentMember}
          content={currentMemberContent}
          onOpenContent={(content) => setSelectedContentId(content.id)}
        />

        <div className="rounded-[24px] border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">How weekly carry-forward works</p>
          <p className="mt-1">
            Writers keep one active content item at a time. If it is still in progress, under review, or waiting on changes, it continues into the next week and shows as continuing work instead of creating a new assignment.
          </p>
        </div>

        {showAddContent ? (
          <AddContentForm
            members={contentWriters}
            onClose={() => setShowAddContent(false)}
            onSubmit={async ({ memberId, title }) => {
              const result = await parseJson<{ content: ContentItem }>(
                await fetch("/api/contents", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    member_id: memberId,
                    week_key: weekKey,
                    title,
                  }),
                }),
              );
              setSelectedContentId(result.content.id);
              setShowAddContent(false);
              await refresh();
            }}
          />
        ) : null}

        <OperatorBanner
          member={operator}
          memberIndex={operator ? memberIndexes[operator.id] ?? 0 : 0}
          onReassign={() => void reassignOperator()}
          poolCount={operatorPool.length}
        />

        <CalendarStrip weekKey={weekKey} />
        <StatCards {...stats} />

        <div className="rounded-[24px] border border-slate-200 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            {[
              ["pipeline", "Pipeline"],
              ["board", "Board"],
              ["published", "Published"],
              ["leaderboard", "Leaderboard"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
                onClick={() => setTab(key as typeof tab)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium whitespace-pre-wrap text-rose-700">
            {error}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-[24px] border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm font-medium text-cyan-800">
            {statusMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-16 text-center text-sm font-medium text-slate-500">
            Loading pipeline...
          </div>
        ) : null}

        {!loading && tab === "pipeline" ? (
          <PipelineTab
            members={contentWriters}
            memberIndexes={memberIndexes}
            contentByMember={contentByMember}
            onSelectContent={(content) => setSelectedContentId(content.id)}
            onQuickAdd={(memberId) => void handleQuickAdd(memberId)}
            pinnedMemberId={currentMember.id}
          />
        ) : null}

        {!loading && tab === "board" ? (
          <BoardTab
            contents={weekPipelineContents}
            membersById={membersById}
            memberIndexes={memberIndexes}
            onSelectContent={(content) => setSelectedContentId(content.id)}
            pinnedMemberId={currentMember.id}
          />
        ) : null}

        {!loading && tab === "published" ? (
          <PublishedTab
            contents={publishedContents}
            membersById={membersById}
            memberIndexes={memberIndexes}
            pinnedMemberId={currentMember.id}
            onSelectContent={(content) => setSelectedContentId(content.id)}
          />
        ) : null}

        {!loading && tab === "leaderboard" ? (
          <LeaderboardTab
            rows={leaderboardRows}
            membersById={membersById}
            memberIndexes={memberIndexes}
          />
        ) : null}

        {selectedContent ? (
          <div ref={detailRef}>
            <DetailPanel
              content={selectedContent}
              member={membersById[selectedContent.member_id] ?? null}
              memberIndex={memberIndexes[selectedContent.member_id] ?? 0}
              pinnedMember={currentMember}
              onClose={() => setSelectedContentId(null)}
              onSave={async (values) => {
                await patchContent(selectedContent.id, values);
              }}
              onAddFeedback={async ({ reviewerName, note }) => {
                await parseJson(
                  await fetch("/api/feedback", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      content_id: selectedContent.id,
                      reviewer_name: reviewerName,
                      note,
                    }),
                  }),
                );
                await refresh();
              }}
              onMoveStage={async (status: ContentStatus) => {
                await patchContent(selectedContent.id, { status });
              }}
              onSchedule={async (date) => {
                await patchContent(selectedContent.id, {
                  status: "scheduled",
                  publish_date: date,
                });
              }}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
