import { formatDateDisplay } from "@/lib/utils/date";

export function formatInformasiDebiturDate(
  value: string | null | undefined,
  fallback = "-",
): string {
  return formatDateDisplay(value, fallback);
}

export function normalizeDebiturDocumentUrl(filePath: string): string {
  if (/^https?:\/\//i.test(filePath)) return filePath;
  if (/^(blob:|data:)/i.test(filePath)) return filePath;
  if (filePath.startsWith("/")) return filePath;
  return `/${filePath}`;
}

export function getDebiturDocumentPreviewType(
  filePath: string,
  explicitType?: "pdf" | "jpg" | "png" | "image",
): "pdf" | "image" {
  if (explicitType === "pdf") return "pdf";
  if (explicitType === "jpg" || explicitType === "png") return "image";
  return filePath.toLowerCase().endsWith(".pdf") ? "pdf" : "image";
}
