"use client";

import { useState } from "react";
import { ClipboardList, Pencil, Plus, UploadCloud, X } from "lucide-react";
import DebiturViewButton from "@/components/debitur/DebiturViewButton";
import { dummyDebiturList, dummyLangkahPenanganan } from "@/lib/data";
import type { LangkahPenanganan } from "@/lib/types/modul3";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { todayIsoDate } from "@/lib/utils/date";
import {
  formatInformasiDebiturDate,
  normalizeDebiturDocumentUrl,
} from "@/lib/utils/informasi-debitur";
import StatusBadge from "@/components/marketing/StatusBadge";
import StatusEditModal from "@/components/marketing/StatusEditModal";
import SearchableDebiturSelect from "@/components/marketing/SearchableDebiturSelect";
import DetailModal, {
  DetailSection,
  DetailRow,
} from "@/components/marketing/DetailModal";
import KolBadge from "@/components/marketing/KolBadge";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import { useObjectUrlRegistry } from "@/hooks/useObjectUrlRegistry";

export default function LangkahPenangananPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { createObjectUrl } = useObjectUrlRegistry();
  const [data, setData] = useState<LangkahPenanganan[]>([
    ...dummyLangkahPenanganan,
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<LangkahPenanganan | null>(null);
  const [statusEditItem, setStatusEditItem] =
    useState<LangkahPenanganan | null>(null);
  const [isLoading] = useState(false);
  const [selectedDebitur, setSelectedDebitur] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    tanggal: todayIsoDate(),
    langkah: "",
    hasilPenanganan: "",
  });
  const { showToast } = useAppToast();

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({
      tanggal: todayIsoDate(),
      langkah: "",
      hasilPenanganan: "",
    });
    setSelectedDebitur("");
    setFile(null);
    setDragOver(false);
  };

  const handleFileValidation = (nextFile: File): boolean => {
    const isPdf =
      nextFile.type === "application/pdf" ||
      nextFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      showToast("Lampiran harus berformat PDF.", "error");
      return false;
    }
    if (nextFile.size > 5 * 1024 * 1024) {
      showToast("Ukuran file maksimal 5MB.", "error");
      return false;
    }
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return;
    const nextFile = event.target.files[0];
    if (!handleFileValidation(nextFile)) return;
    setFile(nextFile);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    if (!event.dataTransfer.files?.[0]) return;
    const nextFile = event.dataTransfer.files[0];
    if (!handleFileValidation(nextFile)) return;
    setFile(nextFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedDebitur ||
      !form.tanggal ||
      !form.langkah ||
      !form.hasilPenanganan
    ) {
      showToast("Semua field harus diisi!", "error");
      return;
    }

    const newItem: LangkahPenanganan = {
      id: `LP${Date.now()}`,
      debiturId: selectedDebitur,
      tanggal: form.tanggal,
      langkah: form.langkah,
      hasilPenanganan: form.hasilPenanganan,
      status: "Pending",
      createdBy: "User",
      lampiranFilePath: file ? createObjectUrl(file) : undefined,
      lampiranFileName: file?.name,
      lampiranFileType: file ? "pdf" : undefined,
      lampiranFileSize: file?.size,
    };

    setData((current) => [newItem, ...current]);
    closeModal();
    showToast("Langkah penanganan berhasil ditambahkan!", "success");
  };

  const handleStatusSave = (
    item: LangkahPenanganan,
    newStatus: LangkahPenanganan["status"],
  ) => {
    setData((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d)),
    );
    setStatusEditItem(null);
    showToast("Status berhasil diubah!", "success");
  };

  const getDebiturName = (id: string) => {
    const debitur = dummyDebiturList.find((d) => d.id === id);
    return debitur ? debitur.namaNasabah : id;
  };

  const getDebiturKol = (id: string) => {
    const debitur = dummyDebiturList.find((d) => d.id === id);
    return debitur?.kolektibilitas || "1";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Langkah Penanganan"
        subtitle="Dokumentasi langkah-langkah penanganan debitur bermasalah"
        icon={<ClipboardList />}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-upload"
            title="Tambah Langkah"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah Langkah
          </button>
        }
      />

      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Tanggal
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Debitur
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Langkah
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Hasil
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Lampiran
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="hover:bg-blue-50/30 transition-colors cursor-pointer"
              >
                <td className="px-5 py-4 text-sm text-gray-600 text-center">
                  {formatInformasiDebiturDate(item.tanggal)}
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-gray-900">
                      {getDebiturName(item.debiturId)}
                    </span>
                    <KolBadge kol={getDebiturKol(item.debiturId)} />
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700 font-medium text-center">
                  {item.langkah}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 text-center">
                  {item.hasilPenanganan}
                </td>
                <td
                  className="px-5 py-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.lampiranFilePath ? (
                    <DebiturViewButton
                      onClick={() =>
                        openPreview(
                          normalizeDebiturDocumentUrl(item.lampiranFilePath!),
                          item.lampiranFileName ||
                            "lampiran_langkah_penanganan.pdf",
                          "pdf",
                        )
                      }
                      title="View lampiran"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td
                  className="px-5 py-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center gap-2">
                    <StatusBadge status={item.status} />
                    <button
                      type="button"
                      onClick={() => setStatusEditItem(item)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-[#157ec3]"
                      title="Ubah status"
                      aria-label="Ubah status"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
        >
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Tambah Langkah Penanganan
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pilih Debitur
                </label>
                <SearchableDebiturSelect
                  value={selectedDebitur}
                  onChange={setSelectedDebitur}
                  options={dummyDebiturList
                    .filter((d) => parseInt(d.kolektibilitas) >= 2)
                    .map((d) => ({
                      id: d.id,
                      namaNasabah: d.namaNasabah,
                      kolektibilitas: d.kolektibilitas,
                      osPokok: d.osPokok,
                    }))}
                  placeholder="Cari debitur berdasarkan nama/ID..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Input
                </label>
                <DatePickerInput
                  value={form.tanggal}
                  onChange={(nextValue) =>
                    setForm((prev) => ({ ...prev, tanggal: nextValue }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Langkah Penanganan
                </label>
                <select
                  value={form.langkah}
                  onChange={(e) =>
                    setForm({ ...form, langkah: e.target.value })
                  }
                  className="select"
                  required
                >
                  <option value="">-- Pilih Langkah --</option>
                  <option value="Penagihan via telepon">
                    Penagihan via telepon
                  </option>
                  <option value="Kunjungan langsung">Kunjungan langsung</option>
                  <option value="Pengiriman Surat Peringatan">
                    Pengiriman Surat Peringatan
                  </option>
                  <option value="Negosiasi restrukturisasi">
                    Negosiasi restrukturisasi
                  </option>
                  <option value="Somasi hukum">Somasi hukum</option>
                  <option value="Lelang jaminan">Lelang jaminan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasil Penanganan
                </label>
                <textarea
                  value={form.hasilPenanganan}
                  onChange={(e) =>
                    setForm({ ...form, hasilPenanganan: e.target.value })
                  }
                  rows={3}
                  className="textarea resize-none"
                  placeholder="Jelaskan hasil dari langkah penanganan..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Lampiran (PDF, maks 5MB) - Opsional
                </label>
                <div
                  className={`file-upload ${dragOver ? "dragover" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() =>
                    document
                      .getElementById("langkahPenangananPdfInput")
                      ?.click()
                  }
                >
                  <input
                    id="langkahPenangananPdfInput"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center">
                    <UploadCloud
                      className="w-10 h-10 text-[#157ec3] mb-2"
                      aria-hidden="true"
                    />
                    {file ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Klik atau drag & drop PDF
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Hanya PDF, maksimal 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-upload px-4 py-2.5 text-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Detail Langkah Penanganan"
      >
        {detailItem && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailSection title="Informasi Utama">
              <DetailRow
                label="Debitur"
                value={
                  <span className="flex items-center gap-2">
                    {getDebiturName(detailItem.debiturId)}
                    <KolBadge kol={getDebiturKol(detailItem.debiturId)} />
                  </span>
                }
              />
              <DetailRow label="Langkah" value={detailItem.langkah} />
              <DetailRow label="Hasil" value={detailItem.hasilPenanganan} />
            </DetailSection>
            <DetailSection title="Metadata">
              <DetailRow
                label="Tanggal"
                value={formatInformasiDebiturDate(detailItem.tanggal)}
              />
              <DetailRow label="Dibuat oleh" value={detailItem.createdBy} />
              <DetailRow
                label="Lampiran"
                value={
                  detailItem.lampiranFilePath ? (
                    <DebiturViewButton
                      onClick={() =>
                        openPreview(
                          normalizeDebiturDocumentUrl(
                            detailItem.lampiranFilePath!,
                          ),
                          detailItem.lampiranFileName ||
                            "lampiran_langkah_penanganan.pdf",
                          "pdf",
                        )
                      }
                      title="View lampiran"
                    />
                  ) : (
                    "-"
                  )
                }
              />
            </DetailSection>
            <div className="md:col-span-2">
              <DetailSection title="Status">
                <StatusBadge status={detailItem.status} />
              </DetailSection>
            </div>
          </div>
        )}
      </DetailModal>

      <StatusEditModal
        isOpen={!!statusEditItem}
        onClose={() => setStatusEditItem(null)}
        currentStatus={statusEditItem?.status ?? "Pending"}
        onSave={(newStatus) =>
          statusEditItem && handleStatusSave(statusEditItem, newStatus)
        }
        title="Ubah Status Langkah Penanganan"
      />
    </div>
  );
}
