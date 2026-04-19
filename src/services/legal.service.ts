import api from "@/lib/axios";
import type {
  KlaimAsuransi,
  ProgressAsuransi,
  ProgressNotaris,
  TitipanAngsuran,
  TitipanAsuransi,
  TitipanNotaris,
} from "@/types/legal.types";

export const legalService = {
  getNotaryProgresses: async (): Promise<ProgressNotaris[]> => {
    void api;
    return [];
  },
  getInsuranceProgresses: async (): Promise<ProgressAsuransi[]> => {
    return [];
  },
  getInsuranceClaims: async (): Promise<KlaimAsuransi[]> => {
    return [];
  },
  getNotaryDeposits: async (): Promise<TitipanNotaris[]> => {
    return [];
  },
  getInsuranceDeposits: async (): Promise<TitipanAsuransi[]> => {
    return [];
  },
  getInstallmentDeposits: async (): Promise<TitipanAngsuran[]> => {
    return [];
  },
};
