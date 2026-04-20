import api from "@/lib/axios";
import {
  deriveDocumentFileName,
  toPreviewableFileUrl,
} from "@/lib/utils/file";
import {
  extractList,
  extractRecord,
  readNullableString,
  readNumber,
  readString,
} from "@/services/api.utils";
import type {
  OutgoingMailPayload,
  SuratKeluar,
} from "@/types/surat.types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function formatOutgoingStatusLabel(statusCode: number | null | undefined) {
  if (statusCode === 1) return "Aktif";
  if (statusCode === 0) return "Nonaktif";
  if (statusCode === null || statusCode === undefined) return "-";
  return String(statusCode);
}

function mapSuratKeluar(
  record: Record<string, unknown>,
  index = 0,
): SuratKeluar | null {
  const rawId = readString(record, "id");
  const id = rawId ?? index + 1;
  const recipientName = readString(record, "name");
  const mailNumber = readString(record, "mail_number");
  const sendDate = readString(record, "send_date");
  const address = readString(record, "address");
  const deliveryMedia = readString(record, "delivery_media");
  const statusCode = readNumber(record, "status") ?? undefined;
  const letterPriorityRecord = asRecord(record.letter_prioritie);

  if (!sendDate || !recipientName || !mailNumber) return null;

  const fileValue = readNullableString(record, "file");
  const fallbackFileName = fileValue
    ? deriveDocumentFileName(fileValue, `surat-keluar-${mailNumber}`)
    : "";
  const previewableFileUrl = fileValue
    ? toPreviewableFileUrl(fileValue, fallbackFileName)
    : undefined;
  const sifatSurat =
    (letterPriorityRecord ? readString(letterPriorityRecord, "name") : null) ??
    "Biasa";
  const normalizedSifat = sifatSurat.trim().toLowerCase();

  return {
    id,
    namaSurat: mailNumber,
    penerima: recipientName,
    alamatPenerima: address ?? "-",
    tanggalKirim: sendDate,
    media: deliveryMedia ?? "-",
    sifat:
      normalizedSifat === "sangat rahasia"
        ? "Sangat Rahasia"
        : normalizedSifat === "rahasia"
          ? "Rahasia"
          : normalizedSifat === "terbatas"
            ? "Terbatas"
            : "Biasa",
    fileName: fallbackFileName,
    fileUrl: previewableFileUrl,
    letterPrioritieId: readString(record, "letter_prioritie_id") ?? undefined,
    statusCode,
    statusLabel: formatOutgoingStatusLabel(statusCode),
    mailNumberRaw: mailNumber,
    mediaRaw: deliveryMedia ?? undefined,
  };
}

export const suratKeluarService = {
  getAll: async (): Promise<SuratKeluar[]> => {
    const res = await api.get("/outgoing-mails");
    return extractList(res.data)
      .map((record, index) => mapSuratKeluar(record, index))
      .filter((item): item is SuratKeluar => item !== null);
  },
  create: async (data: OutgoingMailPayload): Promise<SuratKeluar | null> => {
    const res = await api.post("/outgoing-mails", data);
    const record = extractRecord(res.data);
    return record ? mapSuratKeluar(record) : null;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/outgoing-mails/${id}`);
  },
};
