import { getWeekDateMeta, isToday } from "../lib/weeks";

export function CalendarStrip({ weekKey }: { weekKey: string }) {
  const dates = getWeekDateMeta(weekKey);

  return (
    <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 sm:grid-cols-5">
      {dates.map(({ date, dayLabel }) => {
        const deadline =
          dayLabel === "Mon"
            ? "Title deadline"
            : dayLabel === "Thu"
              ? "Content due"
              : null;

        return (
          <div
            key={dayLabel}
            className={`rounded-2xl border px-4 py-4 transition ${
              isToday(date)
                ? "border-cyan-300 bg-cyan-50 shadow-[0_12px_32px_-20px_rgba(14,165,233,0.8)]"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {dayLabel}
              </p>
              {isToday(date) ? (
                <span className="rounded-full bg-cyan-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Today
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-3xl font-semibold text-slate-900">{date.getDate()}</p>
            <p className="mt-1 text-sm text-slate-500">
              {date.toLocaleDateString("en-US", { month: "short" })}
            </p>
            {deadline ? (
              <p
                className={`mt-4 text-sm font-semibold ${
                  dayLabel === "Mon" ? "text-amber-600" : "text-rose-600"
                }`}
              >
                {deadline}
              </p>
            ) : (
              <div className="mt-4 h-5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

