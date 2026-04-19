export interface SuratUser {
  id: string;
  nama: string;
  divisi: string;
}

export type SuratMasukStatus = "BARU" | "DIDISPOSISI" | "SELESAI";

export interface SuratDisposisi {
  id: string;
  surat_masuk_id: string;
  dari_user_id: string;
  dari_user_nama: string;
  ke_user_id: string;
  ke_user_nama: string;
  catatan: string | null;
  created_at: string;
  is_disposisi_ulang: boolean;
}

export type SifatSurat =
  | "Biasa"
  | "Terbatas"
  | "Rahasia"
  | "Sangat Rahasia";

export interface SuratMasuk {
  id: string | number;
  namaSurat: string;
  pengirim: string;
  alamatPengirim: string;
  perihal: string;
  keterangan?: string;
  tanggalTerima: string;
  sifat: SifatSurat;
  disposisiKepada: string[];
  statusDisposisi: "Pending" | "Dalam Proses" | "Selesai";
  status: SuratMasukStatus;
  disposisi_history: SuratDisposisi[];
  fileName: string;
  fileUrl?: string;
  tenggatWaktu?: string;
  keteranganTenggat?: string;
}

export interface SuratKeluar {
  id: string | number;
  namaSurat: string;
  penerima: string;
  alamatPenerima: string;
  tanggalKirim: string;
  media: string;
  sifat: SifatSurat;
  fileName: string;
  fileUrl?: string;
  letterPrioritieId?: string;
  statusCode?: number;
  statusLabel: string;
  mailNumberRaw?: string;
  mediaRaw?: string;
}

export interface MemorandumDisposisi {
  id: string;
  memorandum_id: string;
  dari_user_id: string;
  dari_user_nama: string;
  ke_user_id: string;
  ke_user_nama: string;
  catatan: string | null;
  created_at: string;
  start_date: string | null;
  due_date: string | null;
  is_disposisi_ulang: boolean;
}

export interface Memorandum {
  id: string | number;
  noMemo: string;
  perihal: string;
  divisiPengirim: string;
  pembuatMemo: string;
  tanggal: string;
  keterangan: string;
  penerimaTipe: "divisi" | "perorangan";
  penerima: string[];
  fileName: string;
  fileUrl?: string;
  tenggatWaktu?: string;
  keteranganTenggat?: string;
  statusCode?: number;
  divisionId?: string;
  receivedDate?: string;
  disposisi_history: MemorandumDisposisi[];
}

export interface IncomingDispositionPayload {
  receiver_id: string;
  sender_id: string;
  note?: string;
  due_date?: string;
}

export interface IncomingMailPayload {
  letter_prioritie_id: string;
  regarding: string;
  receive_date: string;
  mail_number: string;
  name: string;
  description?: string;
  file?: string;
  is_active?: boolean;
  address: string;
  dispositions?: IncomingDispositionPayload[];
}

export interface IncomingRedispositionPayload {
  receiver_id: string;
  sender_id: string;
  note?: string;
  start_date?: string;
  due_date?: string;
}

export interface OutgoingMailPayload {
  letter_prioritie_id: string;
  delivery_media: string;
  send_date: string;
  mail_number: string;
  name: string;
  file?: string;
  status?: number;
  address: string;
}

export interface MemorandumReceiverPayload {
  receiver_id: string;
  due_date?: string;
}

export interface MemorandumPayload {
  division_id: string;
  regarding: string;
  memo_date: string;
  received_date: string;
  due_date?: string;
  memo_number: string;
  description?: string;
  file?: string;
  status?: number;
  receivers: MemorandumReceiverPayload[];
}

export interface MemorandumRedispositionPayload {
  receiver_id: string;
  note?: string;
  start_date?: string;
  due_date?: string;
}
