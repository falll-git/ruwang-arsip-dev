import api from "@/lib/axios";
import type { Debitur } from "@/types/debitur.types";

export const debiturService = {
  getAll: async (): Promise<Debitur[]> => {
    void api;
    return [];
  },
  getById: async (_id: string): Promise<Debitur | null> => {
    void _id;
    return null;
  },
  create: async (_data: Partial<Debitur>): Promise<void> => {
    void _data;
  },
  update: async (_id: string, _data: Partial<Debitur>): Promise<void> => {
    void _id;
    void _data;
  },
  remove: async (_id: string): Promise<void> => {
    void _id;
  },
};
