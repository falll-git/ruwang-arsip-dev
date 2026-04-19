import type { MouseEventHandler } from "react";
import { Eye } from "lucide-react";

export default function LegalViewButton({
  onClick,
  title = "View dokumen",
  className = "",
}: {
  onClick: MouseEventHandler<HTMLButtonElement>;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn btn-view-pdf btn-sm ${className}`.trim()}
      title={title}
      aria-label={title}
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      <span>View</span>
    </button>
  );
}
