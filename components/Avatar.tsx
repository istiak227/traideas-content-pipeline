const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 ring-blue-200",
  "bg-green-100 text-green-700 ring-green-200",
  "bg-amber-100 text-amber-700 ring-amber-200",
  "bg-rose-100 text-rose-700 ring-rose-200",
  "bg-violet-100 text-violet-700 ring-violet-200",
];

export function Avatar({
  initials,
  index = 0,
  size = "md",
}: {
  initials: string;
  index?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : size === "lg"
        ? "h-12 w-12 text-sm"
        : "h-10 w-10 text-sm";

  return (
    <div
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full font-semibold ring-1 ${
        AVATAR_COLORS[index % AVATAR_COLORS.length]
      }`}
    >
      {initials}
    </div>
  );
}

