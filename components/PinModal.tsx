import { Avatar } from "./Avatar";
import { type TeamMember } from "../lib/types";

export function PinModal({
  members,
  memberIndexes,
  open,
  onClose,
  onSelect,
}: {
  members: TeamMember[];
  memberIndexes: Record<string, number>;
  open: boolean;
  onClose: () => void;
  onSelect: (memberId: string) => Promise<void>;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] border border-white/60 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Set your identity</h2>
            <p className="text-sm text-slate-500">
              Pick the teammate this browser should use for review notes.
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

        <div className="mt-6 grid gap-3">
          {members.map((member) => (
            <button
              key={member.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
              onClick={async () => {
                await onSelect(member.id);
                onClose();
              }}
              type="button"
            >
                    <Avatar
                      initials={member.initials}
                      index={memberIndexes[member.id] ?? 0}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-500">{member.initials}</p>
                      <p className="text-xs font-medium text-slate-500">
                        Telegram:{" "}
                        <span
                          className={
                            member.telegram_chat_id ? "text-green-700" : "text-amber-700"
                          }
                        >
                          {member.telegram_chat_id
                            ? member.telegram_username
                              ? `Connected as @${member.telegram_username}`
                              : "Connected"
                            : "Not connected"}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
        </div>
      </div>
    </div>
  );
}
