import { getKolektibilitasColor } from "@/lib/data";

type KolBadgeProps = {
  kol: string;
  className?: string;
};

export default function KolBadge({ kol, className = "" }: KolBadgeProps) {
  const color = getKolektibilitasColor(kol);

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-900 ${className}`}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span aria-label={`Kolektibilitas ${kol}`}>Kol {kol}</span>
    </span>
  );
}
