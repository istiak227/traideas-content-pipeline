export function StatCards({
  awaitingReview,
  inProgress,
  titlePending,
  completed,
}: {
  awaitingReview: number;
  inProgress: number;
  titlePending: number;
  completed: number;
}) {
  const cards = [
    { label: "Awaiting review", value: awaitingReview, accent: "text-orange-600" },
    { label: "In progress", value: inProgress, accent: "text-sky-600" },
    { label: "Title pending", value: titlePending, accent: "text-amber-600" },
    { label: "Completed", value: completed, accent: "text-green-600" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.4)]"
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className={`mt-4 text-4xl font-semibold ${card.accent}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

