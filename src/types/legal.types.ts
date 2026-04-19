export interface RiwayatBPRSLain {
  namaBPRS: string;
  kolektibilitas: number;
  osPokok: number;
  periode: string;
}

export interface IdebRingkasan {
  kolektibilitasBerjalan: number;
  osPokok: number;
  statusPembiayaan: string;
  riwayatBPRSLain: RiwayatBPRSLain[];
  kesimpulan: "AMAN" | "PERHATIAN" | "BERMASALAH";
}

export interface IdebRecord {
  id: string;
  debiturId: string;
  namaNasabah: string;
  noKontrak: string;
  bulan: number;
  namaBulan: string;
  tahun: number;
  tanggalUpload: string;
  status: "CHECKED" | "PENDING";
  ringkasan?: IdebRingkasan;
}

export type CetakDokumenLegalType =
  | "AKAD"
  | "HAFTSHEET"
  | "SURAT_PERINGATAN"
  | "FORMULIR_ASURANSI"
  | "SKL"
  | "SAMSAT";

export interface CetakDokumenRecord {
  id: string;
  nasabahId: string;
  namaNasabah: string;
  noKontrak: string;
  jenisDokumen: CetakDokumenLegalType;
  tanggalCetak: string;
  dicetakOleh: string;
  keterangan?: string;
}

export type ProgresPHK3Kategori =
  | "NOTARIS"
  | "ASURANSI"
  | "TRACKING_CLAIM";

export type ProgresPHK3Status = "AKTIF" | "SELESAI" | "PENDING";

export interface ProgresPHK3Record {
  id: string;
  nasabahId: string;
  namaNasabah: string;
  noKontrak: string;
  kategori: ProgresPHK3Kategori;
  status: ProgresPHK3Status;
  tanggalInput: string;
  keterangan?: string;
}

export interface NasabahAsuransiInfo {
  perusahaan: string;
  jenisAsuransi: "Jiwa" | "Kebakaran" | "Kendaraan";
  nilaiPertanggungan: number;
  periodeAwal: string;
  periodeAkhir: string;
  noPolis: string;
}

export interface KendaraanAgunan {
  noPolisi: string;
  merk: string;
  type: string;
  tahun: number;
  noBPKB: string;
  noRangka: string;
  noMesin: string;
}

export interface NasabahLegal {
  id: number;
  noKontrak: string;
  nama: string;
  nik: string;
  alamat: string;
  cabang: string;
  status: "Aktif" | "Lunas" | "Bermasalah";
  produk: string;
  jenisAkad: string;
  plafond: number;
  margin: number;
  jangkaWaktu: number;
  tanggalAkad: string;
  objekPembiayaan: string;
  agunan: string;
  kolektibilitas: number;
  tunggakanPokok: number;
  tunggakanMargin: number;
  kendaraan?: KendaraanAgunan;
  asuransi?: NasabahAsuransiInfo;
}

export interface TitipanRiwayatTransaksi {
  tanggal: string;
  nominal: number;
  aksi: string;
  keterangan?: string;
}

export interface TitipanNotaris {
  id: number;
  noKontrak: string;
  namaNasabah: string;
  notarisId?: number;
  namaNotaris: string;
  jenisAkta: "APHT" | "Fidusia" | "Roya" | "Surat Kuasa";
  nominal: number;
  tanggalSetor: string;
  status:
    | "Belum Dibayar"
    | "Sebagian Dibayar"
    | "Sudah Dibayar"
    | "Dikembalikan";
  userInput: string;
  keterangan: string;
  nominalBayar?: number;
  tanggalBayar?: string;
  noAkta?: string;
  tanggalKembali?: string;
  alasanKembali?: string;
  riwayatTransaksi?: TitipanRiwayatTransaksi[];
}

export interface HistoryCetak {
  id: number;
  tanggal: string;
  jenis: string;
  noSurat: string;
  noKontrak: string;
  namaNasabah: string;
  detail: string;
  user: string;
}

export interface LinkedDocument {
  id: number;
  noKontrak: string;
  noBerkas: string;
  keterangan: string;
  tanggalInput: string;
  userInput: string;
}

export interface ProgressAsuransi {
  id: number;
  noKontrak: string;
  namaNasabah: string;
  perusahaanAsuransi: string;
  jenisAsuransi: "Jiwa" | "Kebakaran" | "Kendaraan";
  nilaiPertanggungan: number;
  periodeAwal: string;
  periodeAkhir: string;
  status: "Proses" | "Aktif" | "Expired" | "Klaim";
  userInput: string;
  catatan: string;
  noPolis?: string;
  lampiranFilePath?: string;
  lampiranFileName?: string;
  lampiranFileType?: "pdf";
  lampiranFileSize?: number;
}

export interface ProgressNotaris {
  id: number;
  noKontrak: string;
  namaNasabah: string;
  notarisId?: number;
  namaNotaris: string;
  jenisAkta: "APHT" | "Fidusia" | "Roya" | "Surat Kuasa";
  tanggalMasuk: string;
  estimasiSelesai: string;
  status: "Proses" | "Selesai" | "Bermasalah";
  userInput: string;
  catatan: string;
  noAkta?: string;
  tanggalSelesai?: string;
  lampiranFilePath?: string;
  lampiranFileName?: string;
  lampiranFileType?: "pdf";
  lampiranFileSize?: number;
}

export interface KlaimAsuransi {
  id: number;
  noKontrak: string;
  namaNasabah: string;
  noPolis: string;
  perusahaanAsuransi: string;
  jenisKlaim:
    | "Meninggal Dunia"
    | "Kecelakaan"
    | "Sakit Kritis"
    | "Kebakaran"
    | "Kehilangan";
  nilaiKlaim: number;
  tanggalPengajuan: string;
  status: "Pengajuan" | "Verifikasi" | "Disetujui" | "Ditolak" | "Cair";
  userInput: string;
  catatan: string;
  nilaiCair?: number;
  tanggalCair?: string;
  alasanTolak?: string;
  lampiranFilePath?: string;
  lampiranFileName?: string;
  lampiranFileType?: "pdf";
  lampiranFileSize?: number;
}

export interface TitipanAsuransi {
  id: number;
  noKontrak: string;
  namaNasabah: string;
  jenisAsuransi: "Jiwa" | "Kebakaran" | "Kendaraan";
  perusahaanAsuransi: string;
  nominal: number;
  tanggalSetor: string;
  status:
    | "Belum Dibayar"
    | "Sebagian Dibayar"
    | "Sudah Dibayar"
    | "Dikembalikan";
  userInput: string;
  keterangan: string;
  nominalBayar?: number;
  noPolis?: string;
  noBuktiBayar?: string;
  tanggalBayar?: string;
  tanggalKembali?: string;
  alasanKembali?: string;
  riwayatTransaksi?: TitipanRiwayatTransaksi[];
}

export interface TitipanAngsuran {
  id: number;
  noKontrak: string;
  namaNasabah: string;
  keperluan: string;
  nominal: number;
  tanggalSetor: string;
  status: "Pending" | "Sebagian Diproses" | "Sudah Diproses" | "Dikembalikan";
  userInput: string;
  keterangan: string;
  nominalDiproses?: number;
  tanggalProses?: string;
  keteranganProses?: string;
  tanggalKembali?: string;
  alasanKembali?: string;
  riwayatTransaksi?: TitipanRiwayatTransaksi[];
}

export interface HistorisTitipanDebitur {
  id: string;
  sumberId: number;
  jenisTitipan: "Notaris" | "Asuransi" | "Angsuran";
  noKontrak: string;
  tanggal: string;
  nominal: number;
  nominalTitipan: number;
  nominalTerbayar: number;
  saldoAkhir: number;
  status: string;
  keterangan: string;
  riwayatTransaksi: TitipanRiwayatTransaksi[];
}
