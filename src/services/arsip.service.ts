import api from "@/lib/axios";
import type { Dokumen } from "@/types/arsip.types";

export const arsipService = {
  getAll: async (): Promise<Dokumen[]> => {
    void api;
    return [];
  },
  getById: async (_id: string): Promise<Dokumen | null> => {
    void _id;
    return null;
  },
  create: async (_data: Partial<Dokumen>): Promise<void> => {
    void _data;
  },
  update: async (_id: string, _data: Partial<Dokumen>): Promise<void> => {
    void _id;
    void _data;
  },
  remove: async (_id: string): Promise<void> => {
    void _id;
  },
};
