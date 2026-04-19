import api from "@/lib/axios";
import type { Disposisi } from "@/types/arsip.types";

export const disposisiArsipService = {
  getAll: async (): Promise<Disposisi[]> => {
    void api;
    return [];
  },
  getById: async (_id: string): Promise<Disposisi | null> => {
    void _id;
    return null;
  },
  create: async (_data: Partial<Disposisi>): Promise<void> => {
    void _data;
  },
  update: async (_id: string, _data: Partial<Disposisi>): Promise<void> => {
    void _id;
    void _data;
  },
  remove: async (_id: string): Promise<void> => {
    void _id;
  },
};
