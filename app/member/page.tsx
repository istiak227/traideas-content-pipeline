"use client";

import { useEffect, useState } from "react";

import { AddMemberForm } from "../../components/AddMemberForm";
import { Avatar } from "../../components/Avatar";
import { type TeamMember } from "../../lib/types";

async function parseJson<T>(response: Response) {
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error || "Request failed.");
  }

  return (await response.json()) as T;
}

export default function MemberPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  async function loadMembers() {
    setLoading(true);
    setError("");
    try {
      const result = await parseJson<{ members: TeamMember[] }>(await fetch("/api/members"));
      setMembers(result.members);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  async function updateMember(memberId: string, body: Record<string, unknown>) {
    await parseJson(
      await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    await loadMembers();
  }

  async function removeMember(member: TeamMember) {
    const confirmed = window.confirm(
      `Remove ${member.name} from Traideas Content Pipeline? This also removes their related pipeline records.`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    await parseJson(
      await fetch(`/api/members/${member.id}`, {
        method: "DELETE",
      }),
    );
    setStatusMessage(`${member.name} was removed.`);
    await loadMembers();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#eef3f8_100%)]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">
            Members
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Member settings
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Toggle who appears in the writing pipeline, who can be in the operator pool, and who is connected to Telegram.
          </p>
        </div>

        <AddMemberForm
          onClose={() => undefined}
          onSubmit={async ({ name, initials }) => {
            await parseJson<{ member: TeamMember }>(
              await fetch("/api/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, initials }),
              }),
            );
            await loadMembers();
          }}
        />

        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
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
            Loading members...
          </div>
        ) : null}

        {!loading ? (
          <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
            <table className="w-full min-w-[1280px]">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Pipeline writer</th>
                  <th className="px-5 py-4">Operator pool</th>
                  <th className="px-5 py-4">Telegram</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, index) => (
                  <tr key={member.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={member.initials} index={index} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.initials}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <input
                        className="w-full min-w-52 rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-cyan-400"
                        defaultValue={member.email}
                        placeholder="member@example.com"
                        onBlur={async (event) => {
                          const nextEmail = event.target.value.trim();
                          if (nextEmail === member.email) {
                            return;
                          }
                          await updateMember(member.id, { email: nextEmail });
                          setStatusMessage("Member email updated.");
                        }}
                      />
                    </td>
                    <td className="px-5 py-5">
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          member.is_content_writer === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                        onClick={async () => {
                          await updateMember(member.id, {
                            is_content_writer: member.is_content_writer === 1 ? 0 : 1,
                          });
                        }}
                        type="button"
                      >
                        {member.is_content_writer === 1 ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="px-5 py-5">
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          member.is_operator_eligible === 1
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                        onClick={async () => {
                          await updateMember(member.id, {
                            is_operator_eligible:
                              member.is_operator_eligible === 1 ? 0 : 1,
                          });
                        }}
                        type="button"
                      >
                        {member.is_operator_eligible === 1 ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="px-5 py-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              member.telegram_chat_id
                                ? "bg-green-100 text-green-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {member.telegram_chat_id ? "Connected" : "Not connected"}
                          </span>
                          {member.telegram_username ? (
                            <span className="text-sm font-medium text-slate-600">
                              @{member.telegram_username}
                            </span>
                          ) : null}
                        </div>
                        {member.telegram_connected_at ? (
                          <p className="text-xs text-slate-500">
                            Connected {member.telegram_connected_at}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-700">
                            Telegram not connected yet.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-full border border-cyan-200 px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50"
                            onClick={async () => {
                              const result = await parseJson<{
                                deep_link: string;
                                expires_at: string;
                              }>(
                                await fetch("/api/telegram/connect-link", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ member_id: member.id }),
                                }),
                              );
                              window.open(result.deep_link, "_blank", "noopener,noreferrer");
                              setStatusMessage(
                                `Open Telegram, press Start, then come back here. Link expires at ${result.expires_at}.`,
                              );
                            }}
                            type="button"
                          >
                            {member.telegram_chat_id ? "Reconnect Telegram" : "Connect Telegram"}
                          </button>
                          <button
                            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={async () => {
                              await parseJson(
                                await fetch("/api/telegram/test", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ member_id: member.id }),
                                }),
                              );
                              setStatusMessage("Test message request sent.");
                            }}
                            type="button"
                          >
                            Send test message
                          </button>
                          <button
                            className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => void loadMembers()}
                            type="button"
                          >
                            Refresh status
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex justify-end">
                        <button
                          className="rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                          onClick={() => void removeMember(member)}
                          type="button"
                        >
                          Remove member
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </main>
  );
}
