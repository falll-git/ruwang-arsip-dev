"use client";

import { FileUp, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export interface TambahDokumenPayload {
  namaDokumen: string;
  keterangan: string;
  file: File;
  kategori: "AWAL" | "LAINNYA";
}

export default function TambahDokumenModal({
  isOpen,
  onClose,
  onSubmit,
  kategori,
  presetName,
  lockName = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: TambahDokumenPayload) => void;
  kategori: "AWAL" | "LAINNYA";
  presetName?: string;
  lockName?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <TambahDokumenModalContent
      key={`${kategori}-${presetName ?? "baru"}`}
      onClose={onClose}
      onSubmit={onSubmit}
      kategori={kategori}
      presetName={presetName}
      lockName={lockName}
    />
  );
}

function TambahDokumenModalContent({
  onClose,
  onSubmit,
  kategori,
  presetName,
  lockName = false,
}: {
  onClose: () => void;
  onSubmit: (payload: TambahDokumenPayload) => void;
  kategori: "AWAL" | "LAINNYA";
  presetName?: string;
  lockName?: boolean;
}) {
  const [namaDokumen, setNamaDokumen] = useState(presetName ?? "");
  const [keterangan, setKeterangan] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!namaDokumen.trim() || !file) return;

    onSubmit({
      namaDokumen: namaDokumen.trim(),
      keterangan: keterangan.trim(),
      file,
      kategori,
    });
  };

  return (
    <div
      data-dashboard-overlay="true"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {kategori === "AWAL" ? "Upload Dokumen Awal" : "Tambah Dokumen"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {kategori === "AWAL"
                ? "Lengkapi dokumen standar debitur."
                : "Tambahkan dokumen pendukung tambahan untuk debitur ini."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nama Dokumen
            </label>
            <input
              type="text"
              value={namaDokumen}
              onChange={(event) => setNamaDokumen(event.target.value)}
              className="input"
              placeholder="Masukkan nama dokumen"
              disabled={lockName}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Keterangan
            </label>
            <textarea
              value={keterangan}
              onChange={(event) => setKeterangan(event.target.value)}
              className="textarea min-h-28 w-full resize-none"
              placeholder="Tambahkan catatan bila diperlukan"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Upload File
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#157ec3]/30 bg-[#157ec3]/5 px-6 py-8 text-center transition-colors hover:bg-[#157ec3]/8">
              <FileUp className="mb-3 h-8 w-8 text-[#157ec3]" aria-hidden="true" />
              <span className="text-sm font-semibold text-gray-800">
                {file ? file.name : "Pilih file PDF / JPG / PNG"}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                Maksimal satu file untuk setiap dokumen
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                required
              />
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="upload">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {kategori === "AWAL" ? "Upload Dokumen" : "Tambah Dokumen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
