import type { Role } from "@/lib/rbac";
import type { Disposisi, Dokumen, Peminjaman } from "@/types/arsip.types";
import type { StoredUser } from "@/types/auth.types";
import type {
  KolektibilitasItem,
  KolektibilitasNasabahItem,
  PihakKetiga,
  PihakKetigaSummary,
  ProgressPihakKetiga,
  TitipanNasabah,
  TitipanSummary,
  RiwayatNPF,
} from "@/types/dashboard.types";
import type {
  ActionPlan,
  Debitur,
  DokumenDebitur,
  HasilKunjungan,
  HistorisKolektibilitas,
  LangkahPenanganan,
  NotarisDebitur,
  SuratPeringatan,
  UploadRestrik,
  UploadSLIK,
} from "@/types/debitur.types";
import type {
  CetakDokumenRecord,
  HistoryCetak,
  HistorisTitipanDebitur,
  IdebRecord,
  IdebRingkasan,
  KlaimAsuransi,
  NasabahLegal,
  ProgressAsuransi,
  ProgressNotaris,
  ProgresPHK3Record,
  TitipanAngsuran,
  TitipanAsuransi,
  TitipanNotaris,
} from "@/types/legal.types";
import type {
  JenisDokumen,
  MasterNotaris,
  TempatPenyimpanan,
} from "@/types/master.types";
import type {
  Memorandum,
  SuratKeluar,
  SuratMasuk,
  SuratUser,
} from "@/types/surat.types";

export type { Disposisi, Dokumen, Peminjaman } from "@/types/arsip.types";
export type { StoredUser, User } from "@/types/auth.types";
export type {
  ActionPlan,
  Debitur,
  DokumenDebitur,
  HasilKunjungan,
  HistorisKolektibilitas,
  LangkahPenanganan,
  NotarisDebitur,
  SuratPeringatan,
  UploadRestrik,
  UploadSLIK,
} from "@/types/debitur.types";
export type {
  CetakDokumenRecord,
  HistoryCetak,
  IdebRecord,
  KlaimAsuransi,
  NasabahLegal,
  ProgressAsuransi,
  ProgressNotaris,
  TitipanAngsuran,
  TitipanAsuransi,
  TitipanNotaris,
} from "@/types/legal.types";
export type {
  JenisDokumen,
  MasterNotaris,
  TempatPenyimpanan,
} from "@/types/master.types";
export type { Memorandum, SuratKeluar, SuratMasuk, SuratUser } from "@/types/surat.types";

export const dummyUsers: StoredUser[] = [];

export const dummyTempatPenyimpanan: TempatPenyimpanan[] = [];

export const dummyJenisDokumen: JenisDokumen[] = [];

export const dummyDokumen: Dokumen[] = [];

export const dummyDisposisi: Disposisi[] = [];

export const dummyPeminjaman: Peminjaman[] = [];

export const dummyDivisiList: string[] = [];

export const dummySuratUsers: SuratUser[] = [];

export const dummySuratMasuk: SuratMasuk[] = [];

export const dummySuratKeluar: SuratKeluar[] = [];

export const dummyMemorandum: Memorandum[] = [];

export const dummyDebiturList: Debitur[] = [];

export const dummyUploadSLIK: UploadSLIK[] = [];

export const dummyUploadRestrik: UploadRestrik[] = [];

export const dummyActionPlan: ActionPlan[] = [];

export const dummyHasilKunjungan: HasilKunjungan[] = [];

export const dummyLangkahPenanganan: LangkahPenanganan[] = [];

export const dummyNasabahLegal: NasabahLegal[] = [];

export const dummyHistoryCetak: HistoryCetak[] = [];

export const dummyProgressAsuransi: ProgressAsuransi[] = [];

export const dummyProgressNotaris: ProgressNotaris[] = [];

export const dummyKlaimAsuransi: KlaimAsuransi[] = [];

export const dummyTitipanNotaris: TitipanNotaris[] = [];

export const dummyTitipanAsuransi: TitipanAsuransi[] = [];

export const dummyTitipanAngsuran: TitipanAngsuran[] = [];

export const dummyIdebRecords: IdebRecord[] = [];

export const pihakKetigaData: PihakKetiga[] = [];

export const pihakKetigaSummary: PihakKetigaSummary[] = [];

export const progressPihakKetiga: ProgressPihakKetiga[] = [];

export const cetakDokumenLegalData: CetakDokumenRecord[] = [];

export const progresPHK3Data: ProgresPHK3Record[] = [];

export const kolektibilitasData: KolektibilitasItem[] = [];

export const nasabahKolektibilitasData: KolektibilitasNasabahItem[] = [];

export const npfKolektibilitasColors: Record<number, string> = {
  1: "#15803d",
  2: "#65a30d",
  3: "#ca8a04",
  4: "#ea580c",
  5: "#dc2626",
};

export const riwayatNPFData: RiwayatNPF[] = [];

export const titipanNasabahData: TitipanNasabah[] = [];

export const titipanSummary: TitipanSummary[] = [];

export const dummyMasterNotaris: MasterNotaris[] = [];

export const notarisOptions: string[] = [];

export const jenisAkadOptions: string[] = [];

export const jenisAktaOptions: Array<"APHT" | "Fidusia" | "Roya" | "Surat Kuasa"> = [];

export const jenisAsuransiOptions: Array<"Jiwa" | "Kebakaran" | "Kendaraan"> = [];

export const perusahaanAsuransiOptions: string[] = [];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getKolektibilitasColor(kol: string | number): string {
  switch (String(kol)) {
    case "1":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "2":
      return "bg-lime-100 text-lime-700 border-lime-200";
    case "3":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "4":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "5":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function getKolektibilitasLabel(kol: string | number): string {
  switch (String(kol)) {
    case "1":
      return "Lancar";
    case "2":
      return "Dalam Perhatian Khusus";
    case "3":
      return "Kurang Lancar";
    case "4":
      return "Diragukan";
    case "5":
      return "Macet";
    default:
      return "-";
  }
}

export function getDebiturById(_id: string): Debitur | null {
  void _id;
  return null;
}

export function getHistorisKolektibilitasByDebiturId(
  _debiturId: string,
): HistorisKolektibilitas[] {
  void _debiturId;
  return [];
}

export function getDokumenByDebiturId(_debiturId: string): DokumenDebitur[] {
  void _debiturId;
  return [];
}

export function getNotarisByDebiturId(_debiturId: string): NotarisDebitur[] {
  void _debiturId;
  return [];
}

export function getActionPlanByDebiturId(_debiturId: string): ActionPlan[] {
  void _debiturId;
  return [];
}

export function getHasilKunjunganByDebiturId(
  _debiturId: string,
): HasilKunjungan[] {
  void _debiturId;
  return [];
}

export function getLangkahPenangananByDebiturId(
  _debiturId: string,
): LangkahPenanganan[] {
  void _debiturId;
  return [];
}

export function getSuratPeringatanByDebiturId(
  _debiturId: string,
): SuratPeringatan[] {
  void _debiturId;
  return [];
}

export function buildIdebRingkasanByDebiturId(
  _debiturId: string,
): IdebRingkasan | undefined {
  void _debiturId;
  return undefined;
}

export function getKlaimAsuransiByNoKontrak(
  _noKontrak: string,
): KlaimAsuransi[] {
  void _noKontrak;
  return [];
}

export function getHistorisTitipanByNoKontrak(
  _noKontrak: string,
): HistorisTitipanDebitur[] {
  void _noKontrak;
  return [];
}

export function getSaldoDanaTitipanByNoKontrak(_noKontrak: string): number {
  void _noKontrak;
  return 0;
}

export function getRoleLabel(role: Role): string {
  return role;
}
