export type KolektibilitasType = "1" | "2" | "3" | "4" | "5";

export interface Debitur {
  id: string;
  noKontrak: string;
  noIdentitas: string;
  namaNasabah: string;
  alamat: string;
  noTelp: string;
  pokok: number;
  margin: number;
  jangkaWaktu: number;
  osPokok: number;
  osMargin: number;
  kolektibilitas: KolektibilitasType;
  tanggalAkad: string;
  tanggalJatuhTempo: string;
  cabang: string;
  marketing: string;
}

export interface PengecekanBPRS {
  id: string;
  debiturId: string;
  namaBPRS: string;
  status: "Tidak Ada" | "Ada - Lancar" | "Ada - Bermasalah";
  outstanding: number;
  kolektibilitas: KolektibilitasType;
  tanggalCek: string;
}

export interface HistorisKolektibilitas {
  id: string;
  debiturId: string;
  bulan: string;
  kolektibilitas: KolektibilitasType;
  osPokok: number;
  osMargin: number;
  keterangan: string;
}

export interface DokumenDebitur {
  id: string;
  debiturId: string;
  namaDokumen: string;
  jenisDokumen:
    | "KTP"
    | "KK"
    | "NPWP"
    | "Akad"
    | "Jaminan"
    | "BPKB"
    | "Penghasilan"
    | "Foto"
    | "Lainnya";
  kategori?: "AWAL" | "LAINNYA";
  keterangan?: string;
  tanggalUpload: string;
  filePath: string;
  fileType?: "pdf" | "jpg" | "png" | "image";
}

export interface NotarisDebitur {
  id: string;
  debiturId: string;
  jenisDokumen: "Akad" | "APHT" | "Fidusia" | "Roya" | "Surat Kuasa";
  namaNotaris: string;
  keterangan?: string;
  filePath?: string;
  fileType?: "pdf" | "image";
}

export interface ActionPlan {
  id: string;
  debiturId: string;
  tanggal: string;
  rencana: string;
  targetTanggal: string;
  status: "Belum" | "Pending" | "Proses" | "Selesai";
  createdBy: string;
  timelineGroupId?: string;
  lampiranFilePath?: string;
  lampiranFileName?: string;
  lampiranFileType?: "pdf";
  lampiranFileSize?: number;
}

export interface HasilKunjungan {
  id: string;
  debiturId: string;
  tanggalKunjungan: string;
  alamat: string;
  hasilKunjungan: string;
  kesimpulan: string;
  status?: "Positif" | "Negatif" | "Netral";
  fotoKunjungan?: string;
  fotoKunjunganNama?: string;
  fotoKunjunganTipe?: "pdf" | "image";
  createdBy: string;
  timelineGroupId?: string;
}

export interface LangkahPenanganan {
  id: string;
  debiturId: string;
  tanggal: string;
  langkah: string;
  hasilPenanganan: string;
  status: "Belum" | "Pending" | "Proses" | "Selesai";
  createdBy: string;
  timelineGroupId?: string;
  lampiranFilePath?: string;
  lampiranFileName?: string;
  lampiranFileType?: "pdf";
  lampiranFileSize?: number;
}

export interface SuratPeringatan {
  id: string;
  debiturId: string;
  jenisSurat: "SP1" | "SP2" | "SP3";
  tanggalTerbit: string;
  tanggalKirim: string;
  statusKirim: "Belum Dikirim" | "Sudah Dikirim" | "Diterima";
  keterangan: string;
}

export interface UploadSLIK {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadBy: string;
  status: "Pending" | "Diproses" | "Selesai";
  totalRecord: number;
}

export interface UploadRestrik {
  id: string;
  fileName: string;
  uploadDate: string;
  uploadBy: string;
  status: "Pending" | "Diproses" | "Selesai";
  totalRecord: number;
}
