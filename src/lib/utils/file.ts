export type DocumentFileType = "pdf" | "image";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

function sanitizeBase64(value: string) {
  return value.replace(/\s+/g, "");
}

function normalizeFileNameBase(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function inferMimeTypeFromFileName(fileName?: string | null): string | null {
  if (typeof fileName !== "string" || !fileName.trim()) return null;

  const normalized = fileName.trim().toLowerCase();
  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".bmp")) return "image/bmp";
  if (normalized.endsWith(".svg")) return "image/svg+xml";

  return null;
}

function inferMimeTypeFromBase64(base64: string): string | null {
  const normalized = sanitizeBase64(base64);

  if (normalized.startsWith("JVBERi0")) return "application/pdf";
  if (normalized.startsWith("iVBORw0KGgo")) return "image/png";
  if (normalized.startsWith("/9j/")) return "image/jpeg";
  if (normalized.startsWith("R0lGOD")) return "image/gif";
  if (normalized.startsWith("UklGR")) return "image/webp";
  if (normalized.startsWith("Qk")) return "image/bmp";
  if (
    normalized.startsWith("PHN2Zy") ||
    normalized.startsWith("PD94bWwg") ||
    normalized.startsWith("77u/PHN2Zy")
  ) {
    return "image/svg+xml";
  }

  return null;
}

function extractMimeTypeFromDataUrl(value: string): string | null {
  const match = value.match(/^data:([^;,]+);base64,/i);
  return match?.[1] ?? null;
}

function looksLikeBase64(value: string) {
  const normalized = sanitizeBase64(value);
  return (
    normalized.length > 32 &&
    normalized.length % 4 === 0 &&
    /^[A-Za-z0-9+/=]+$/.test(normalized)
  );
}

function getDataUrlMimeType(value: string, fileName?: string | null) {
  return (
    extractMimeTypeFromDataUrl(value) ??
    inferMimeTypeFromFileName(fileName) ??
    inferMimeTypeFromBase64(value)
  );
}

export function isValidFileUrl(url?: string | null): url is string {
  if (typeof url !== "string" || !url || url.trim() === "") {
    return false;
  }

  const trimmed = url.trim();
  if (trimmed.startsWith("http://")) return true;
  if (trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("/")) return true;
  if (trimmed.startsWith("blob:")) return true;
  if (trimmed.startsWith("data:")) return true;
  return false;
}

export function toPreviewableFileUrl(
  value?: string | null,
  fileName?: string | null,
): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const trimmed = value.trim();
  if (isValidFileUrl(trimmed)) return trimmed;

  if (!looksLikeBase64(trimmed)) return undefined;

  const mimeType = getDataUrlMimeType(trimmed, fileName);
  if (!mimeType) return undefined;

  return `data:${mimeType};base64,${sanitizeBase64(trimmed)}`;
}

export function deriveDocumentFileName(
  value?: string | null,
  fallbackBaseName = "dokumen",
): string {
  const safeBaseName = normalizeFileNameBase(fallbackBaseName) || "dokumen";

  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
      const normalized = trimmed.split("#")[0].split("?")[0];
      const fileName = normalized.split("/").filter(Boolean).pop();
      if (fileName) return decodeURIComponent(fileName);
    }

    if (!trimmed.startsWith("data:") && !looksLikeBase64(trimmed)) {
      return trimmed;
    }

    const mimeType = getDataUrlMimeType(trimmed);
    const extension = mimeType ? MIME_EXTENSION_MAP[mimeType] : null;
    if (extension) {
      return `${safeBaseName}.${extension}`;
    }
  }

  return `${safeBaseName}.pdf`;
}

export function detectDocumentFileType(
  fileUrl?: string | null,
  fileName?: string | null,
): DocumentFileType {
  const url = typeof fileUrl === "string" ? fileUrl.trim().toLowerCase() : "";
  const name = typeof fileName === "string" ? fileName.trim().toLowerCase() : "";

  const mimeType = url.startsWith("data:")
    ? extractMimeTypeFromDataUrl(url)
    : inferMimeTypeFromFileName(name);

  if (mimeType === "application/pdf" || url.endsWith(".pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (mimeType?.startsWith("image/")) {
    return "image";
  }

  return "image";
}

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Gagal membaca file yang dipilih."));
        return;
      }

      const [, base64 = ""] = reader.result.split(",", 2);
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file yang dipilih."));
    };

    reader.readAsDataURL(file);
  });
}
