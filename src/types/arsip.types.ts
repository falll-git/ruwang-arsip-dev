import type { DataAccessLevel } from "@/lib/rbac";
import type { TempatPenyimpanan } from "@/types/master.types";

export interface Dokumen {
  id: number;
  kode: string;
  jenisDokumen: string;
  namaDokumen: string;
  detail: string;
  tglInput: string;
  userInput: string;
  tempatPenyimpanan?: string;
  tempatPenyimpananId?: string | number;
  statusPinjam: "Tersedia" | "Dipinjam" | "Dalam Proses" | "Diajukan";
  statusPeminjaman?: "Tersedia" | "Dipinjam" | "Dalam Proses" | "Diajukan";
  noKontrak?: string | null;
  debiturId?: string | null;
  levelAkses: DataAccessLevel;
  restrict: boolean;
  fileUrl?: string;
}

export interface Disposisi {
  id: number;
  dokumenId: number;
  detail: string;
  pemohon: string;
  pemilik: string;
  tglPengajuan: string;
  status: "Pending" | "Approved" | "Rejected";
  alasanPengajuan: string;
  tglExpired: string | null;
  tglAksi: string | null;
  alasanAksi: string | null;
}

export interface Peminjaman {
  id: number;
  dokumenId: number;
  detail: string;
  peminjam: string;
  tglPinjam: string;
  tglKembali: string;
  tglPengembalian: string | null;
  status: "Pending" | "Disetujui" | "Ditolak" | "Dipinjam" | "Dikembalikan";
  alasan: string;
  approver: string | null;
  tglApprove: string | null;
  jamApprove: string | null;
  alasanApprove: string | null;
  tglPenyerahan: string | null;
}

export interface Kantor {
  id: string;
  namaKantor: string;
}

export interface Lemari {
  id: string;
  kantorId: string;
  kodeLemari: string;
}

export interface Rak {
  id: string;
  lemariId: string;
  namaRak: string;
  totalArsip: number;
}

export type DokumenArsipJenis = "DIGITAL" | "FISIK";
export type DokumenArsipKategori =
  | "Perusahaan"
  | "Pembiayaan"
  | "Karyawan"
  | "Voucher";

export interface DokumenArsip {
  id: string;
  rakId: string;
  namaDokumen: string;
  jenisDokumen: DokumenArsipKategori;
  jenis: DokumenArsipJenis;
  tanggalInput: string;
}

export type DisposisiArsipStatus = "PENDING" | "PROSES" | "SELESAI" | "DITOLAK";

export interface DisposisiArsip {
  id: string;
  lemariId: string;
  dokumenId?: number;
  status: DisposisiArsipStatus;
}

export type PeminjamanArsipStatus =
  | "Pending"
  | "Disetujui"
  | "Ditolak"
  | "Dipinjam"
  | "Dikembalikan";

export interface PeminjamanArsip {
  id: string;
  lemariId: string;
  dokumenId?: number;
  namaDokumen: string;
  peminjam: string;
  tanggalPinjam: string;
  tanggalKembali: string;
  status: PeminjamanArsipStatus;
}

export interface Penyimpanan {
  tempatPenyimpanan: TempatPenyimpanan[];
  dokumen: Dokumen[];
}
