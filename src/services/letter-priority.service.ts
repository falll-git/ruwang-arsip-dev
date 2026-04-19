import api from "@/lib/axios";
import {
  extractList,
  extractRecord,
  readNullableString,
  readString,
} from "@/services/api.utils";
import type {
  LetterPriority,
  LetterPriorityPayload,
} from "@/types/master.types";

function mapLetterPriority(record: Record<string, unknown>): LetterPriority | null {
  const id = readString(record, "id");
  const name = readString(record, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    code: readNullableString(record, "code"),
    description: readNullableString(record, "description"),
  };
}

export const letterPriorityService = {
  getAll: async (): Promise<LetterPriority[]> => {
    const res = await api.get("/letter-priorities");
    return extractList(res.data)
      .map((record) => mapLetterPriority(record))
      .filter((item): item is LetterPriority => item !== null);
  },
  getById: async (id: string): Promise<LetterPriority | null> => {
    const res = await api.get(`/letter-priorities/${id}`);
    const record = extractRecord(res.data);
    return record ? mapLetterPriority(record) : null;
  },
  create: async (data: LetterPriorityPayload): Promise<LetterPriority> => {
    const res = await api.post("/letter-priorities", data);
    const record = extractRecord(res.data);
    const mapped = record ? mapLetterPriority(record) : null;

    if (!mapped) {
      throw new Error(
        "Respons create prioritas surat dari server tidak valid",
      );
    }

    return mapped;
  },
  update: async (
    id: string,
    data: LetterPriorityPayload,
  ): Promise<LetterPriority> => {
    const res = await api.put(`/letter-priorities/${id}`, data);
    const record = extractRecord(res.data);
    const mapped = record ? mapLetterPriority(record) : null;

    if (!mapped) {
      throw new Error(
        "Respons update prioritas surat dari server tidak valid",
      );
    }

    return mapped;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/letter-priorities/${id}`);
  },
};
