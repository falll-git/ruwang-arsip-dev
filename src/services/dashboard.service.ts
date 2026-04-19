import api from "@/lib/axios";
import type {
  DashboardSummary,
  KolektibilitasItem,
  MarketingActivity,
  PihakKetigaSummary,
  RiwayatNPF,
  TitipanSummary,
} from "@/types/dashboard.types";

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary[]> => {
    void api;
    return [];
  },
  getPihakKetigaSummary: async (): Promise<PihakKetigaSummary[]> => {
    return [];
  },
  getTitipanSummary: async (): Promise<TitipanSummary[]> => {
    return [];
  },
  getNpfHistory: async (): Promise<RiwayatNPF[]> => {
    return [];
  },
  getKolektibilitas: async (): Promise<KolektibilitasItem[]> => {
    return [];
  },
  getMarketingActivities: async (): Promise<MarketingActivity[]> => {
    return [];
  },
};
