import api from "@/lib/axios";
import {
  extractList,
  extractRecord,
  readString,
} from "@/services/api.utils";
import type { Division, DivisionPayload } from "@/types/master.types";

function mapDivision(record: Record<string, unknown>): Division | null {
  const id = readString(record, "id");
  const name = readString(record, "name");

  if (!id || !name) return null;

  return {
    id,
    name,
    code: readString(record, "code") ?? undefined,
  };
}

export const divisionService = {
  getAll: async (): Promise<Division[]> => {
    const res = await api.get("/divisions");
    return extractList(res.data)
      .map((record) => mapDivision(record))
      .filter((item): item is Division => item !== null);
  },
  getById: async (id: string): Promise<Division | null> => {
    const res = await api.get(`/divisions/${id}`);
    const record = extractRecord(res.data);
    return record ? mapDivision(record) : null;
  },
  create: async (data: DivisionPayload): Promise<Division> => {
    const res = await api.post("/divisions", data);
    const record = extractRecord(res.data);
    const mapped = record ? mapDivision(record) : null;

    if (!mapped) {
      throw new Error("Respons create divisi dari server tidak valid");
    }

    return mapped;
  },
  update: async (id: string, data: DivisionPayload): Promise<Division> => {
    const res = await api.put(`/divisions/${id}`, data);
    const record = extractRecord(res.data);
    const mapped = record ? mapDivision(record) : null;

    if (!mapped) {
      throw new Error("Respons update divisi dari server tidak valid");
    }

    return mapped;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/divisions/${id}`);
  },
};
