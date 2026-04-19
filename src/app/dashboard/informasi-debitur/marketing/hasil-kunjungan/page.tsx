"use client";

import { useState } from "react";
import { FileText, Pencil, Plus, UploadCloud, X } from "lucide-react";
import DebiturViewButton from "@/components/debitur/DebiturViewButton";
import { dummyDebiturList, dummyHasilKunjungan } from "@/lib/data";
import type { HasilKunjungan } from "@/lib/types/modul3";
import { useAppToast } from "@/components/ui/AppToastProvider";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import FeatureHeader from "@/components/ui/FeatureHeader";
import {
  formatInformasiDebiturDate,
  getDebiturDocumentPreviewType,
  normalizeDebiturDocumentUrl,
} from "@/lib/utils/informasi-debitur";
import DetailModal, {
  DetailSection,
  DetailRow,
} from "@/components/marketing/DetailModal";
import KolBadge from "@/components/marketing/KolBadge";
import SearchableDebiturSelect from "@/components/marketing/SearchableDebiturSelect";
import { useObjectUrlRegistry } from "@/hooks/useObjectUrlRegistry";

export default function HasilKunjunganPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { createObjectUrl, replaceObjectUrl } = useObjectUrlRegistry();
  const [data, setData] = useState<HasilKunjungan[]>([...dummyHasilKunjungan]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<HasilKunjungan | null>(null);
  const [editItem, setEditItem] = useState<HasilKunjungan | null>(null);
  const [isLoading] = useState(false);
  const [selectedDebitur, setSelectedDebitur] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    tanggalKunjungan: "",
    alamat: "",
    hasilKunjungan: "",
    kesimpulan: "",
  });
  const { showToast } = useAppToast();

  const closeModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
    setDragOver(false);
    setFile(null);
    setSelectedDebitur("");
    setForm({
      tanggalKunjungan: "",
      alamat: "",
      hasilKunjungan: "",
      kesimpulan: "",
    });
  };

  const openEditModal = (item: HasilKunjungan) => {
    setEditItem(item);
    setSelectedDebitur(item.debiturId);
    setForm({
      tanggalKunjungan: item.tanggalKunjungan,
      alamat: item.alamat,
      hasilKunjungan: item.hasilKunjungan,
      kesimpulan: item.kesimpulan,
    });
    setIsModalOpen(true);
  };

  const getAttachmentType = (nextFile: File): "pdf" | "image" => {
    const name = nextFile.name.toLowerCase();
    if (nextFile.type === "application/pdf" || name.endsWith(".pdf"))
      return "pdf";
    return "image";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;

    const nextFile = e.target.files[0];
    if (nextFile.size > 10 * 1024 * 1024) {
      showToast("Ukuran file maksimal 10MB", "error");
      return;
    }
    setFile(nextFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!e.dataTransfer.files || !e.dataTransfer.files[0]) return;

    const nextFile = e.dataTransfer.files[0];
    if (nextFile.size > 10 * 1024 * 1024) {
      showToast("Ukuran file maksimal 10MB", "error");
      return;
    }
    setFile(nextFile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedDebitur ||
      !form.tanggalKunjungan ||
      !form.alamat ||
      !form.hasilKunjungan ||
      !form.kesimpulan
    ) {
      showToast("Semua field harus diisi!", "error");
      return;
    }

    if (editItem) {
      const fotoKunjungan = file
        ? replaceObjectUrl(file, editItem.fotoKunjungan)
        : editItem.fotoKunjungan;
      const fotoKunjunganTipe = file
        ? getAttachmentType(file)
        : editItem.fotoKunjunganTipe;
      const fotoKunjunganNama = file ? file.name : editItem.fotoKunjunganNama;

      setData((prev) =>
        prev.map((d) =>
          d.id === editItem.id
            ? {
                ...d,
                debiturId: selectedDebitur,
                tanggalKunjungan: form.tanggalKunjungan,
                alamat: form.alamat,
                hasilKunjungan: form.hasilKunjungan,
                kesimpulan: form.kesimpulan,
                fotoKunjungan,
                fotoKunjunganTipe,
                fotoKunjunganNama,
              }
            : d,
        ),
      );
      showToast("Hasil kunjungan berhasil diubah!", "success");
    } else {
      const fotoKunjungan = file ? createObjectUrl(file) : undefined;
      const fotoKunjunganTipe = file ? getAttachmentType(file) : undefined;
      const fotoKunjunganNama = file ? file.name : undefined;

      const newItem: HasilKunjungan = {
        id: `HKJ${Date.now()}`,
        debiturId: selectedDebitur,
        tanggalKunjungan: form.tanggalKunjungan,
        alamat: form.alamat,
        hasilKunjungan: form.hasilKunjungan,
        kesimpulan: form.kesimpulan,
        fotoKunjungan,
        fotoKunjunganNama,
        fotoKunjunganTipe,
        createdBy: "User",
      };

      setData((current) => [newItem, ...current]);
      showToast("Hasil kunjungan berhasil ditambahkan!", "success");
    }

    closeModal();
  };

  const getDebiturName = (id: string) => {
    const debitur = dummyDebiturList.find((d) => d.id === id);
    return debitur ? debitur.namaNasabah : id;
  };

  const getDebiturKol = (id: string) => {
    const debitur = dummyDebiturList.find((d) => d.id === id);
    return debitur?.kolektibilitas || "1";
  };

  const handleViewDocument = (item: HasilKunjungan, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.fotoKunjungan) return;
    openPreview(
      normalizeDebiturDocumentUrl(item.fotoKunjungan),
      `Lampiran Kunjungan - ${getDebiturName(item.debiturId)}${item.fotoKunjunganNama ? ` (${item.fotoKunjunganNama})` : ""}`,
      item.fotoKunjunganTipe ??
        getDebiturDocumentPreviewType(item.fotoKunjungan),
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isEditMode = !!editItem;

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Hasil Kunjungan"
        subtitle="Dokumentasi hasil kunjungan ke nasabah"
        icon={<FileText />}
        actions={
          <button
            onClick={() => {
              setEditItem(null);
              setForm({
                tanggalKunjungan: "",
                alamat: "",
                hasilKunjungan: "",
                kesimpulan: "",
              });
              setSelectedDebitur("");
              setFile(null);
              setIsModalOpen(true);
            }}
            className="btn btn-upload"
            title="Tambah Hasil Kunjungan"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Tambah Hasil Kunjungan
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
                Hasil Kunjungan
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Alamat
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Kesimpulan
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Lampiran
              </th>
              <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase">
                Aksi
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
                  {formatInformasiDebiturDate(item.tanggalKunjungan)}
                </td>
                <td className="px-5 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-medium text-gray-900">
                      {getDebiturName(item.debiturId)}
                    </span>
                    <KolBadge kol={getDebiturKol(item.debiturId)} />
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700 max-w-xs text-center">
                  <p className="truncate">{item.hasilKunjungan}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 max-w-xs text-center">
                  <p className="truncate">{item.alamat}</p>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 max-w-xs text-center">
                  <p className="truncate">{item.kesimpulan}</p>
                </td>
                <td
                  className="px-5 py-4 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.fotoKunjungan ? (
                    <DebiturViewButton
                      onClick={(event) => handleViewDocument(item, event)}
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
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-[#157ec3]"
                    title="Ubah"
                    aria-label="Ubah"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(isModalOpen || isEditMode) && (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
        >
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditMode ? "Ubah Hasil Kunjungan" : "Tambah Hasil Kunjungan"}
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
                  onChange={(nextDebiturId) => {
                    setSelectedDebitur(nextDebiturId);
                    const selected = dummyDebiturList.find(
                      (item) => item.id === nextDebiturId,
                    );
                    setForm((prev) => ({
                      ...prev,
                      alamat: selected?.alamat ?? prev.alamat,
                    }));
                  }}
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
                  Tanggal Kunjungan
                </label>
                <DatePickerInput
                  value={form.tanggalKunjungan}
                  onChange={(nextValue) =>
                    setForm((prev) => ({
                      ...prev,
                      tanggalKunjungan: nextValue,
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  rows={2}
                  className="textarea resize-none"
                  placeholder="Alamat kunjungan..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hasil Kunjungan
                </label>
                <textarea
                  value={form.hasilKunjungan}
                  onChange={(e) =>
                    setForm({ ...form, hasilKunjungan: e.target.value })
                  }
                  rows={3}
                  className="textarea resize-none"
                  placeholder="Jelaskan hasil kunjungan..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kesimpulan
                </label>
                <textarea
                  value={form.kesimpulan}
                  onChange={(e) =>
                    setForm({ ...form, kesimpulan: e.target.value })
                  }
                  rows={2}
                  className="textarea resize-none"
                  placeholder="Kesimpulan dari kunjungan..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Lampiran{" "}
                  {isEditMode ? "( Kosongkan jika tidak ubah )" : "(Opsional)"}
                </label>
                <div
                  className={`file-upload ${dragOver ? "dragover" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("fileLampiranKunjungan")?.click()
                  }
                >
                  <input
                    id="fileLampiranKunjungan"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
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
                    ) : isEditMode && editItem?.fotoKunjunganNama ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {editItem.fotoKunjunganNama}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Klik untuk ganti file
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Klik atau drag & drop file di sini
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, JPG, PNG (Maks. 10MB)
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
                  className={`flex-1 btn ${isEditMode ? "btn-primary" : "btn-upload"} px-4 py-2.5 text-sm`}
                >
                  {isEditMode ? "Simpan Perubahan" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DetailModal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Detail Hasil Kunjungan"
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
              <DetailRow
                label="Tanggal Kunjungan"
                value={formatInformasiDebiturDate(detailItem.tanggalKunjungan)}
              />
              <DetailRow label="Alamat" value={detailItem.alamat} />
              <DetailRow
                label="Hasil Kunjungan"
                value={detailItem.hasilKunjungan}
              />
              <DetailRow label="Kesimpulan" value={detailItem.kesimpulan} />
            </DetailSection>
            <DetailSection title="Metadata">
              <DetailRow label="Dibuat oleh" value={detailItem.createdBy} />
            </DetailSection>
            {detailItem.fotoKunjungan && (
              <div className="md:col-span-2">
                <DetailSection title="File / Lampiran">
                  <DebiturViewButton
                    onClick={() => {
                      openPreview(
                        normalizeDebiturDocumentUrl(detailItem.fotoKunjungan!),
                        `Lampiran - ${getDebiturName(detailItem.debiturId)}${detailItem.fotoKunjunganNama ? ` (${detailItem.fotoKunjunganNama})` : ""}`,
                        detailItem.fotoKunjunganTipe ??
                          getDebiturDocumentPreviewType(
                            detailItem.fotoKunjungan!,
                          ),
                      );
                    }}
                    title="View dokumen"
                  />
                </DetailSection>
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
