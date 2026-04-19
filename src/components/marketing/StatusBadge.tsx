"use client";

const STATUS_COLORS: Record<string, string> = {
  Belum: "#6b7280",
  Pending: "#f59e0b",
  Proses: "#3b82f6",
  Selesai: "#10b981",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({
  status,
}: StatusBadgeProps): React.JSX.Element {
  const color = STATUS_COLORS[status] ?? "#6b7280";
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {status}
    </span>
  );
}
