import api from "@/lib/axios";
import type { Peminjaman } from "@/types/arsip.types";

export const peminjamanService = {
  getAll: async (): Promise<Peminjaman[]> => {
    void api;
    return [];
  },
  getById: async (_id: string): Promise<Peminjaman | null> => {
    void _id;
    return null;
  },
  create: async (_data: Partial<Peminjaman>): Promise<void> => {
    void _data;
  },
  update: async (_id: string, _data: Partial<Peminjaman>): Promise<void> => {
    void _id;
    void _data;
  },
  remove: async (_id: string): Promise<void> => {
    void _id;
  },
};
