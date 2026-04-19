import api from "@/lib/axios";
import {
  extractList,
  extractRecord,
  readNullableString,
  readString,
} from "@/services/api.utils";
import type {
  IncomingRedispositionPayload,
  IncomingMailPayload,
  SuratDisposisi,
  SuratMasuk,
} from "@/types/surat.types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function readDispositions(record: UnknownRecord): string[] {
  const source = Array.isArray(record.dispositions)
    ? record.dispositions
    : Array.isArray(record.disposition_mails)
      ? record.disposition_mails
      : null;
  if (!source) return [];

  return source
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)
    .map((item) => {
      const receiverRecord = asRecord(item.receiver);
      return (
        readString(item, "receiver_name", "receiverName") ??
        (receiverRecord
          ? readString(receiverRecord, "name", "username", "email")
          : null) ??
        readString(item, "receiver_id", "receiverId") ??
        "-"
      );
    });
}

function readDispositionHistory(record: UnknownRecord): SuratDisposisi[] {
  const source = Array.isArray(record.disposition_mails)
    ? record.disposition_mails
    : Array.isArray(record.dispositions)
      ? record.dispositions
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
        id: readString(normalized, "id") ?? `disp-${index + 1}`,
        surat_masuk_id:
          readString(
            normalized,
            "incoming_mails_id",
            "incoming_mail_id",
            "surat_masuk_id",
            "incomingMailId",
          ) ?? "",
        dari_user_id: senderId,
        dari_user_nama:
          readString(normalized, "sender_name", "senderName") ??
          (senderRecord
            ? readString(senderRecord, "name", "username", "email")
            : null) ??
          senderId ??
          "-",
        ke_user_id: receiverId,
        ke_user_nama:
          readString(normalized, "receiver_name", "receiverName") ??
          (receiverRecord
            ? readString(receiverRecord, "name", "username", "email")
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
        is_disposisi_ulang:
          index > 0 ||
          Boolean(readNullableString(normalized, "start_date", "startDate")),
      };
    })
    .filter((item): item is SuratDisposisi => item !== null);
}

function mapSuratMasuk(record: UnknownRecord, index = 0): SuratMasuk | null {
  const rawId = readString(record, "id");
  const id = rawId ?? index + 1;
  const regarding = readString(record, "regarding", "perihal");
  const name = readString(record, "name");
  const mailNumber = readString(record, "mail_number", "mailNumber");
  const address = readString(record, "address");
  const receiveDate = readString(record, "receive_date", "receiveDate");
  const letterPriorityRecord = asRecord(
    record.letter_prioritie ?? record.letter_priority,
  );

  if (!regarding || !receiveDate) return null;

  const disposisiKepada = readDispositions(record);
  const disposisiHistory = readDispositionHistory(record).sort(
    (left, right) => {
      const leftTime = new Date(left.created_at).getTime();
      const rightTime = new Date(right.created_at).getTime();
      const normalizedLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const normalizedRight = Number.isNaN(rightTime) ? 0 : rightTime;
      return normalizedRight - normalizedLeft;
    },
  );

  const sortedDispositionMails = (
    Array.isArray(record.disposition_mails) ? record.disposition_mails : []
  )
    .slice()
    .sort((a, b) => {
      const aRecord = asRecord(a);
      const bRecord = asRecord(b);
      const aTimeStr = aRecord
        ? (readString(aRecord, "created_at", "disposed_at") ?? "")
        : "";
      const bTimeStr = bRecord
        ? (readString(bRecord, "created_at", "disposed_at") ?? "")
        : "";
      const aTime = new Date(aTimeStr).getTime();
      const bTime = new Date(bTimeStr).getTime();
      const normalizedA = Number.isNaN(aTime) ? 0 : aTime;
      const normalizedB = Number.isNaN(bTime) ? 0 : bTime;
      return normalizedB - normalizedA;
    });
  const firstDispositionMail =
    sortedDispositionMails.length > 0
      ? asRecord(sortedDispositionMails[0])
      : null;

  const sortedDispositions = (
    Array.isArray(record.dispositions) ? record.dispositions : []
  )
    .slice()
    .sort((a, b) => {
      const aRecord = asRecord(a);
      const bRecord = asRecord(b);
      const aTimeStr = aRecord
        ? (readString(aRecord, "created_at", "disposed_at") ?? "")
        : "";
      const bTimeStr = bRecord
        ? (readString(bRecord, "created_at", "disposed_at") ?? "")
        : "";
      const aTime = new Date(aTimeStr).getTime();
      const bTime = new Date(bTimeStr).getTime();
      const normalizedA = Number.isNaN(aTime) ? 0 : aTime;
      const normalizedB = Number.isNaN(bTime) ? 0 : bTime;
      return normalizedB - normalizedA;
    });
  const firstDisposition =
    sortedDispositions.length > 0 ? asRecord(sortedDispositions[0]) : null;
  const description = readNullableString(record, "description", "keterangan");
  const fileValue = readNullableString(record, "file", "file_url", "fileUrl");
  const rawStatus = record.status;
  const numericStatus =
    typeof rawStatus === "number"
      ? rawStatus
      : typeof rawStatus === "string"
        ? Number(rawStatus)
        : Number.NaN;
  const sifatSurat =
    readString(
      record,
      "letter_prioritie_name",
      "letterPriorityName",
      "priority_name",
    ) ??
    (letterPriorityRecord ? readString(letterPriorityRecord, "name") : null) ??
    "Biasa";
  const normalizedSifat = sifatSurat.trim().toLowerCase();

  return {
    id,
    namaSurat: mailNumber ?? regarding ?? name ?? "-",
    pengirim:
      readString(record, "sender_name", "senderName", "sender") ?? name ?? "-",
    alamatPengirim: address ?? "-",
    perihal: regarding,
    keterangan: description,
    tanggalTerima: receiveDate,
    sifat:
      normalizedSifat === "sangat rahasia"
        ? "Sangat Rahasia"
        : normalizedSifat === "rahasia"
          ? "Rahasia"
          : normalizedSifat === "terbatas"
            ? "Terbatas"
            : "Biasa",
    disposisiKepada,
    statusDisposisi:
      numericStatus === 2
        ? "Selesai"
        : disposisiKepada.length > 0
          ? "Dalam Proses"
          : "Pending",
    status:
      numericStatus === 2
        ? "SELESAI"
        : disposisiKepada.length > 0
          ? "DIDISPOSISI"
          : "BARU",
    disposisi_history: disposisiHistory,
    fileName: fileValue ?? "",
    fileUrl: fileValue,
    tenggatWaktu:
      readNullableString(record, "due_date", "dueDate") ??
      (firstDispositionMail
        ? readNullableString(firstDispositionMail, "due_date", "dueDate")
        : undefined) ??
      (firstDisposition
        ? readNullableString(firstDisposition, "due_date", "dueDate")
        : undefined),
    keteranganTenggat:
      readNullableString(record, "note", "catatan") ??
      (firstDispositionMail
        ? readNullableString(firstDispositionMail, "note", "catatan")
        : undefined) ??
      (firstDisposition
        ? readNullableString(firstDisposition, "note", "catatan")
        : undefined),
  };
}

export const suratMasukService = {
  getAll: async (): Promise<SuratMasuk[]> => {
    const res = await api.get("/incoming-mails");
    return extractList(res.data)
      .map((record, index) => mapSuratMasuk(record, index))
      .filter((item): item is SuratMasuk => item !== null);
  },
  createWithDisposition: async (
    data: IncomingMailPayload,
  ): Promise<SuratMasuk | null> => {
    const res = await api.post("/incoming-mails/with-disposition", data);
    const record = extractRecord(res.data);
    return record ? mapSuratMasuk(record) : null;
  },
  redispose: async (
    id: string,
    data: IncomingRedispositionPayload,
  ): Promise<SuratDisposisi | null> => {
    const res = await api.post(`/incoming-mails/${id}/redispose`, data);
    const record = extractRecord(res.data);

    if (!record) return null;

    const senderRecord = asRecord(record.sender);
    const receiverRecord = asRecord(record.receiver);
    const senderId = readString(record, "sender_id", "senderId") ?? "";
    const receiverId = readString(record, "receiver_id", "receiverId") ?? "";

    return {
      id: readString(record, "id") ?? `disp-${id}`,
      surat_masuk_id:
        readString(
          record,
          "incoming_mails_id",
          "incoming_mail_id",
          "surat_masuk_id",
          "incomingMailId",
        ) ?? id,
      dari_user_id: senderId,
      dari_user_nama:
        readString(record, "sender_name", "senderName") ??
        (senderRecord
          ? readString(senderRecord, "name", "username", "email")
          : null) ??
        senderId ??
        "-",
      ke_user_id: receiverId,
      ke_user_nama:
        readString(record, "receiver_name", "receiverName") ??
        (receiverRecord
          ? readString(receiverRecord, "name", "username", "email")
          : null) ??
        receiverId ??
        "-",
      catatan: readNullableString(record, "note", "catatan") ?? null,
      created_at:
        readString(
          record,
          "disposed_at",
          "created_at",
          "createdAt",
          "start_date",
          "startDate",
        ) ?? new Date().toISOString(),
      is_disposisi_ulang: true,
    };
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/incoming-mails/${id}`);
  },
};
