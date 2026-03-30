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
            Toggle who appears in the writing pipeline and who can be chosen for the weekly operator pool.
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

        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-16 text-center text-sm font-medium text-slate-500">
            Loading members...
          </div>
        ) : null}

        {!loading ? (
          <div className="overflow-x-auto rounded-[24px] border border-slate-200 bg-white">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Pipeline writer</th>
                  <th className="px-5 py-4">Operator pool</th>
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
                      <button
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          member.is_content_writer === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                        onClick={async () => {
                          await parseJson(
                            await fetch(`/api/members/${member.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                is_content_writer: member.is_content_writer === 1 ? 0 : 1,
                              }),
                            }),
                          );
                          await loadMembers();
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
                          await parseJson(
                            await fetch(`/api/members/${member.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                is_operator_eligible:
                                  member.is_operator_eligible === 1 ? 0 : 1,
                              }),
                            }),
                          );
                          await loadMembers();
                        }}
                        type="button"
                      >
                        {member.is_operator_eligible === 1 ? "On" : "Off"}
                      </button>
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
