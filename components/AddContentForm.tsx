import { useState } from "react";
import { FilePlus2 } from "lucide-react";

import { type TeamMember } from "../lib/types";

export function AddContentForm({
  members,
  onSubmit,
  onClose,
}: {
  members: TeamMember[];
  onSubmit: (values: { memberId: string; title: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add content</h2>
          <p className="text-sm text-slate-500">
            A titled entry starts in title submitted. Blank titles stay pending.
          </p>
        </div>
        <button
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.6fr_auto]">
        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder="Optional content title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || !memberId}
          onClick={async () => {
            setSaving(true);
            try {
              await onSubmit({ memberId, title });
              setTitle("");
            } finally {
              setSaving(false);
            }
          }}
          type="button"
        >
          <FilePlus2 className="h-4 w-4" />
          Save content
        </button>
      </div>
    </div>
  );
}

