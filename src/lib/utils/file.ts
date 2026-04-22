export type DocumentFileType = "pdf" | "image";

const PERSURATAN_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const PERSURATAN_ALLOWED_FILE_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "jpg",
  "jpeg",
  "png",
]);
const PERSURATAN_ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

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

function inferExtensionFromFileName(fileName?: string | null): string | null {
  if (typeof fileName !== "string" || !fileName.trim()) return null;

  const normalized = fileName.trim().toLowerCase();
  const segments = normalized.split(".");
  const extension = segments.at(-1);

  return extension && extension !== normalized ? extension : null;
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

export function validatePersuratanFile(file: File): string | null {
  if (!(file instanceof File)) {
    return "File yang dipilih tidak valid.";
  }

  if (file.size <= 0) {
    return "File yang dipilih kosong atau rusak.";
  }

  if (file.size > PERSURATAN_MAX_FILE_SIZE_BYTES) {
    return "Ukuran file maksimal 10MB.";
  }

  const normalizedMimeType = file.type.trim().toLowerCase();
  const extension = inferExtensionFromFileName(file.name);

  if (normalizedMimeType && PERSURATAN_ALLOWED_FILE_MIME_TYPES.has(normalizedMimeType)) {
    return null;
  }

  if (
    extension &&
    PERSURATAN_ALLOWED_FILE_EXTENSIONS.has(extension) &&
    (!normalizedMimeType || normalizedMimeType === "application/octet-stream")
  ) {
    return null;
  }

  if (extension && PERSURATAN_ALLOWED_FILE_EXTENSIONS.has(extension)) {
    return null;
  }

  return "Format file harus PDF, DOC, DOCX, JPG, JPEG, atau PNG.";
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
  const isRawBase64 = looksLikeBase64(trimmed);
  if (trimmed.startsWith("http://")) return true;
  if (trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("/") && !isRawBase64) return true;
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
    const isRawBase64 = looksLikeBase64(trimmed);

    if (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      (trimmed.startsWith("/") && !isRawBase64)
    ) {
      const normalized = trimmed.split("#")[0].split("?")[0];
      const fileName = normalized.split("/").filter(Boolean).pop();
      if (fileName) return decodeURIComponent(fileName);
    }

    if (!trimmed.startsWith("data:") && !isRawBase64) {
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
    const validationMessage = validatePersuratanFile(file);
    if (validationMessage) {
      reject(new Error(validationMessage));
      return;
    }

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
