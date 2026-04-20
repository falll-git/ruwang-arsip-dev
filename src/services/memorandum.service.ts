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
  Memorandum,
  MemorandumDisposisi,
  MemorandumPayload,
  MemorandumRedispositionPayload,
} from "@/types/surat.types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function readReceivers(record: UnknownRecord): string[] {
  const source = Array.isArray(record.dispositions)
    ? record.dispositions
    : Array.isArray(record.receivers)
      ? record.receivers
      : null;
  if (!source) return [];

  return Array.from(
    new Set(
      source
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => {
          const receiverRecord = asRecord(item.receiver);
          return (
            readString(item, "receiver_name", "receiverName") ??
            (receiverRecord
              ? readString(receiverRecord, "name", "username")
              : null) ??
            readString(item, "receiver_id", "receiverId") ??
            "-"
          );
        }),
    ),
  );
}

function readDispositionHistory(record: UnknownRecord): MemorandumDisposisi[] {
  const source = Array.isArray(record.dispositions)
    ? record.dispositions
    : Array.isArray(record.receivers)
      ? record.receivers
      : null;
  if (!source) return [];

  return source
    .map((item, index) => {
      const normalized = asRecord(item);
      if (!normalized) return null;

      const senderRecord = asRecord(normalized.sender);
      const receiverRecord = asRecord(normalized.receiver);
      const senderId = readString(normalized, "sender_id", "senderId") ?? "";
      const receiverId =
        readString(normalized, "receiver_id", "receiverId") ?? "";

      return {
        id: readString(normalized, "id") ?? `memo-disp-${index + 1}`,
        memorandum_id:
          readString(
            normalized,
            "memorandums_id",
            "memorandum_id",
            "memorandumId",
          ) ?? "",
        dari_user_id: senderId,
        dari_user_nama:
          readString(normalized, "sender_name", "senderName") ??
          (senderRecord
            ? readString(senderRecord, "name", "username")
            : null) ??
          senderId ??
          "-",
        ke_user_id: receiverId,
        ke_user_nama:
          readString(normalized, "receiver_name", "receiverName") ??
          (receiverRecord
            ? readString(receiverRecord, "name", "username")
            : null) ??
          receiverId ??
          "-",
        catatan: readNullableString(normalized, "note", "catatan") ?? null,
        created_at:
          readString(
            normalized,
            "disposed_at",
            "created_at",
            "createdAt",
            "start_date",
            "startDate",
          ) ?? new Date().toISOString(),
        start_date:
          readNullableString(normalized, "start_date", "startDate") ?? null,
        due_date: readNullableString(normalized, "due_date", "dueDate") ?? null,
        is_disposisi_ulang:
          index > 0 ||
          Boolean(readNullableString(normalized, "start_date", "startDate")),
      };
    })
    .filter((item): item is MemorandumDisposisi => item !== null);
}

function mapMemorandum(record: UnknownRecord, index = 0): Memorandum | null {
  const rawId = readString(record, "id");
  const id = rawId ?? index + 1;
  const memoNumber = readString(record, "memo_number", "memoNumber");
  const regarding = readString(record, "regarding");
  const memoDate = readString(record, "memo_date", "memoDate");
  const divisionRecord = asRecord(record.division);
  const creatorRecord = asRecord(record.creator);
  const fileValue = readNullableString(record, "file", "file_url", "fileUrl");

  if (!memoNumber || !regarding || !memoDate) return null;

  const fallbackFileName = fileValue
    ? deriveDocumentFileName(fileValue, `memorandum-${memoNumber}`)
    : "";
  const previewableFileUrl = fileValue
    ? toPreviewableFileUrl(fileValue, fallbackFileName)
    : undefined;

  const dispositions = readDispositionHistory(record).sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    const normalizedLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const normalizedRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return normalizedRight - normalizedLeft;
  });
  const latestDispositionWithDueDate =
    dispositions.find((item) => item.due_date) ?? null;
  const latestDispositionWithNote =
    dispositions.find((item) => item.catatan) ?? null;

  return {
    id,
    noMemo: memoNumber,
    perihal: regarding,
    divisiPengirim:
      readString(record, "division_name", "divisionName") ??
      (divisionRecord ? readString(divisionRecord, "name") : null) ??
      readString(record, "division_id", "divisionId") ??
      "-",
    pembuatMemo:
      readString(record, "sender_name", "senderName", "created_by_name") ??
      (creatorRecord
        ? readString(creatorRecord, "name", "username")
        : null) ??
      readString(record, "created_by", "createdBy") ??
      "-",
    tanggal: memoDate,
    keterangan: readString(record, "description") ?? "",
    penerimaTipe: "perorangan",
    penerima: readReceivers(record),
    fileName: fallbackFileName,
    fileUrl: previewableFileUrl,
    tenggatWaktu:
      readNullableString(record, "due_date", "dueDate") ??
      latestDispositionWithDueDate?.due_date ??
      undefined,
    keteranganTenggat:
      readNullableString(record, "note", "catatan") ??
      latestDispositionWithNote?.catatan ??
      undefined,
    statusCode: readNumber(record, "status") ?? undefined,
    divisionId:
      readString(record, "division_id", "divisionId") ?? undefined,
    receivedDate:
      readNullableString(record, "received_date", "receivedDate") ?? undefined,
    disposisi_history: dispositions,
  };
}

export const memorandumService = {
  getAll: async (): Promise<Memorandum[]> => {
    const res = await api.get("/memorandums");
    return extractList(res.data)
      .map((record, index) => mapMemorandum(record, index))
      .filter((item): item is Memorandum => item !== null);
  },
  create: async (data: MemorandumPayload): Promise<Memorandum | null> => {
    const res = await api.post("/memorandums", data);
    const record = extractRecord(res.data);
    return record ? mapMemorandum(record) : null;
  },
  redispose: async (
    id: string,
    data: MemorandumRedispositionPayload,
  ): Promise<void> => {
    await api.post(`/memorandums/${id}/redispose`, data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/memorandums/${id}`);
  },
};
