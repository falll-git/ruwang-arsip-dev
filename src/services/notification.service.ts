import api from "@/lib/axios";
import type { NotificationItem } from "@/types/dashboard.types";

export const notificationService = {
  getAll: async (): Promise<NotificationItem[]> => {
    void api;
    return [];
  },
  getById: async (_id: string): Promise<NotificationItem | null> => {
    void _id;
    return null;
  },
  create: async (data: Partial<NotificationItem>): Promise<void> => {
    await api.post("/notifications", data);
  },
  update: async (
    _id: string,
    _data: Partial<NotificationItem>,
  ): Promise<void> => {
    void _id;
    void _data;
  },
  remove: async (_id: string): Promise<void> => {
    void _id;
  },
};
