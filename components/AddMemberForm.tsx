import { useState } from "react";
import { UserPlus } from "lucide-react";

export function AddMemberForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (values: { name: string; initials: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const [saving, setSaving] = useState(false);

  const deriveInitials = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Add member</h2>
          <p className="text-sm text-slate-500">
            New teammates can be synced into the current week when you press Sync.
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

      <div className="mt-4 grid gap-4 md:grid-cols-[1.5fr_0.7fr_auto]">
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-cyan-400"
          placeholder="Full name"
          value={name}
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            if (!initials) {
              setInitials(deriveInitials(nextName));
            }
          }}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-cyan-400"
          placeholder="Initials"
          maxLength={2}
          value={initials}
          onChange={(event) => setInitials(event.target.value.toUpperCase())}
        />
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving || !name.trim()}
          onClick={async () => {
            setSaving(true);
            try {
              await onSubmit({ name, initials });
              setName("");
              setInitials("");
            } finally {
              setSaving(false);
            }
          }}
          type="button"
        >
          <UserPlus className="h-4 w-4" />
          Save member
        </button>
      </div>
    </div>
  );
}
