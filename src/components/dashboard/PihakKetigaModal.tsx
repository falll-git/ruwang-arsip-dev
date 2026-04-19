"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Scale,
  Search,
  SearchX,
  Shield,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { pihakKetigaData, progressPihakKetiga } from "@/lib/data";
import type {
  PihakKetiga,
  PihakKetigaKategori,
  ProgressPihakKetigaStatus,
} from "@/lib/types";
import { formatDateDisplay } from "@/lib/utils/date";

const defaultDocumentUrl = "/documents/contoh-dok.pdf";

type PihakKetigaProgressTableItem = {
  id: string;
  nama: string;
  kodeDokumen: string;
  jenisDokumen: string;
  namaDokumen: string;
  detailDokumen: string;
  tanggalInput: string;
  userInput: string;
  fileUrl?: string;
  prosesBerjalan: number;
  laporanSelesai: number;
  lewatExpired: number;
};

type PihakKetigaGridItem = PihakKetiga & {
  isPlaceholder?: boolean;
};

const progressStatusLabel: Record<ProgressPihakKetigaStatus, string> = {
  PROSES: "Proses",
  SELESAI: "Selesai",
  EXPIRED: "Expired",
};

const kategoriMeta: Record<
  PihakKetigaKategori,
  {
    icon: LucideIcon;
    label: string;
    badgeClassName: string;
    iconWrapperClassName: string;
    accentClassName: string;
  }
> = {
  NOTARIS: {
    icon: Scale,
    label: "Notaris",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    iconWrapperClassName: "border-sky-100 bg-sky-50 text-sky-600",
    accentClassName: "text-sky-600",
  },
  ASURANSI: {
    icon: Shield,
    label: "Asuransi",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    iconWrapperClassName: "border-sky-100 bg-sky-50 text-sky-600",
    accentClassName: "text-emerald-600",
  },
  KJPP: {
    icon: Building2,
    label: "KJPP",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    iconWrapperClassName: "border-sky-100 bg-sky-50 text-sky-600",
    accentClassName: "text-amber-600",
  },
};

function formatShortDate(value: string) {
  return formatDateDisplay(value, value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function createEmptyPihakKetigaItem(
  kategori: PihakKetigaKategori,
): PihakKetigaGridItem {
  const meta = kategoriMeta[kategori];

  return {
    id: `empty-${kategori.toLowerCase()}`,
    nama: `Daftar Dokumen ${meta.label}`,
    kategori,
    kodeDokumen: "-",
    jenisDokumen: "-",
    namaDokumen: "-",
    detailDokumen: "Belum ada data",
    tanggalInput: "",
    userInput: "-",
    prosesBerjalan: 0,
    laporanSelesai: 0,
    lewatExpired: 0,
    isPlaceholder: true,
  };
}

function PihakKetigaCard({
  item,
  kategori,
  onSelect,
}: {
  item: PihakKetigaGridItem;
  kategori: PihakKetigaKategori;
  onSelect: (item: PihakKetigaGridItem) => void;
}) {
  const meta = kategoriMeta[kategori];
  const CategoryIcon = meta.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg shadow-blue-500/20"
          style={{
            background: "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
          }}
        >
          <CategoryIcon className="h-[18px] w-[18px] text-white" aria-hidden="true" />
        </div>
        {item.isPlaceholder ? (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
            Kosong
          </span>
        ) : null}
      </div>

      <h4
        className="mt-4 truncate text-base font-semibold text-gray-900"
        title={item.nama}
      >
        {item.nama}
      </h4>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-gray-500">
            <Activity className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
            <span className="truncate">Proses Berjalan</span>
          </span>
          <span className="shrink-0 font-semibold text-gray-900">
            {formatNumber(item.prosesBerjalan)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-emerald-700">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span className="truncate">Laporan Selesai</span>
          </span>
          <span className="shrink-0 font-semibold text-emerald-600">
            {formatNumber(item.laporanSelesai)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span
            className={`flex min-w-0 items-center gap-2 ${
              item.lewatExpired > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 shrink-0 ${
                item.lewatExpired > 0 ? "text-red-600" : "text-gray-400"
              }`}
              aria-hidden="true"
            />
            <span className="truncate">Lewat Expired</span>
          </span>
          <span
            className={`shrink-0 font-semibold ${
              item.lewatExpired > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {formatNumber(item.lewatExpired)}
          </span>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm font-semibold ${meta.accentClassName}`}
      >
        <span>{item.isPlaceholder ? "Buka Halaman" : "Lihat Progres"}</span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function openDocument(fileUrl?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const targetUrl = fileUrl && fileUrl.trim().length > 0 ? fileUrl : defaultDocumentUrl;
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

export default function PihakKetigaModal({
  kategori,
  onClose,
}: {
  kategori: PihakKetigaKategori | null;
  onClose: () => void;
}) {
  const [selectedPihakKetigaId, setSelectedPihakKetigaId] = useState<string | null>(
    null,
  );
  const [detailPihakKetigaId, setDetailPihakKetigaId] = useState<string | null>(
    null,
  );
  const [entitySearchTerm, setEntitySearchTerm] = useState("");
  const [tableSearchTerm, setTableSearchTerm] = useState("");

  const modalOpen = kategori !== null;

  const handleClose = useCallback(() => {
    setSelectedPihakKetigaId(null);
    setDetailPihakKetigaId(null);
    setEntitySearchTerm("");
    setTableSearchTerm("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!modalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (detailPihakKetigaId !== null) {
          setDetailPihakKetigaId(null);
          return;
        }

        handleClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailPihakKetigaId, handleClose, modalOpen]);

  const items = useMemo<PihakKetigaGridItem[]>(() => {
    if (kategori === null) {
      return [];
    }

    const realItems = pihakKetigaData.filter((item) => item.kategori === kategori);
    return realItems.length > 0 ? realItems : [createEmptyPihakKetigaItem(kategori)];
  }, [kategori]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedPihakKetigaId) ?? null,
    [items, selectedPihakKetigaId],
  );

  const tableItems = useMemo<PihakKetigaProgressTableItem[]>(() => {
    if (selectedItem === null || selectedItem.isPlaceholder) {
      return [];
    }

    return progressPihakKetiga
      .filter((item) => item.pihakKetigaId === selectedItem.id)
      .map((item) => ({
        id: item.id,
        nama: selectedItem.nama,
        kodeDokumen: item.noKontrak,
        jenisDokumen: progressStatusLabel[item.status],
        namaDokumen: item.namaNasabah,
        detailDokumen: item.keterangan ?? "-",
        tanggalInput: item.tanggalMulai,
        userInput:
          item.tanggalSelesai !== undefined
            ? formatShortDate(item.tanggalSelesai)
            : "Belum selesai",
        fileUrl: selectedItem.fileUrl,
        prosesBerjalan: selectedItem.prosesBerjalan,
        laporanSelesai: selectedItem.laporanSelesai,
        lewatExpired: selectedItem.lewatExpired,
      }));
  }, [selectedItem]);

  const detailItem = useMemo(
    () => tableItems.find((item) => item.id === detailPihakKetigaId) ?? null,
    [detailPihakKetigaId, tableItems],
  );

  const filteredGridItems = useMemo(() => {
    const keyword = entitySearchTerm.trim().toLowerCase();

    if (keyword.length === 0) {
      return items;
    }

    return items.filter((item) => item.nama.toLowerCase().includes(keyword));
  }, [entitySearchTerm, items]);

  const filteredTableItems = useMemo(() => {
    const keyword = tableSearchTerm.trim().toLowerCase();

    if (keyword.length === 0) {
      return tableItems;
    }

    return tableItems.filter(
      (item) =>
        item.kodeDokumen.toLowerCase().includes(keyword) ||
        item.jenisDokumen.toLowerCase().includes(keyword) ||
        item.namaDokumen.toLowerCase().includes(keyword) ||
        item.detailDokumen.toLowerCase().includes(keyword) ||
        item.userInput.toLowerCase().includes(keyword),
    );
  }, [tableItems, tableSearchTerm]);

  if (kategori === null) {
    return null;
  }

  const meta = kategoriMeta[kategori];
  const HeaderIcon = meta.icon;

  const modalContent = (
    <>
      <div
        data-dashboard-overlay="true"
        className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="flex max-h-[85vh] w-[92vw] max-w-[1120px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
          onClick={(event) => event.stopPropagation()}
        >
          {selectedPihakKetigaId === null ? (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-6">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-500/20"
                    style={{
                      background: "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
                    }}
                  >
                    <HeaderIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        Pihak Ketiga - {meta.label}
                      </h3>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Tutup"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                <div className="mb-4">
                  <div className="relative w-full">
                    <Search
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={entitySearchTerm}
                      onChange={(event) => setEntitySearchTerm(event.target.value)}
                      className="input input-with-icon"
                      placeholder="Cari nama pihak ketiga..."
                    />
                  </div>
                </div>

                {filteredGridItems.length > 0 ? (
                  <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                    {filteredGridItems.map((item) => (
                      <PihakKetigaCard
                        key={item.id}
                        item={item}
                        kategori={kategori}
                        onSelect={(selected) => setSelectedPihakKetigaId(selected.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                      <SearchX className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      Tidak ada pihak ketiga yang sesuai
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-6 py-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPihakKetigaId(null)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                    aria-label="Kembali"
                  >
                    <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-xl font-bold text-gray-900">
                        Data {meta.label}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.badgeClassName}`}
                      >
                        {tableItems.length} data
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Tutup"
                >
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="border-b border-gray-100 bg-white px-6 py-4">
                  <div className="relative min-w-0">
                    <Search
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={tableSearchTerm}
                      onChange={(event) => setTableSearchTerm(event.target.value)}
                      className="input input-with-icon"
                      placeholder="Cari kode, nama dokumen, detail, atau user..."
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Double click pada baris tabel untuk melihat detail.
                  </p>
                </div>

                <div className="flex-1 overflow-auto p-0">
                  {filteredTableItems.length > 0 ? (
                    <div className="w-full">
                      <table className="w-full table-fixed border-collapse text-left text-sm">
                        <colgroup>
                          <col className="w-[6%]" />
                          <col className="w-[12%]" />
                          <col className="w-[12%]" />
                          <col className="w-[18%]" />
                          <col className="w-[30%]" />
                          <col className="w-[12%]" />
                          <col className="w-[10%]" />
                        </colgroup>
                        <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              No
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Kode
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Jenis Dok
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Nama Dok
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Detail
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Tgl Input
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              User
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredTableItems.map((item, index) => (
                            <tr
                              key={item.id}
                              onDoubleClick={() => setDetailPihakKetigaId(item.id)}
                              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                                detailPihakKetigaId === item.id ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                              <td className="px-4 py-3">
                                <span className="font-semibold text-gray-700">
                                  {item.kodeDokumen}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-700">
                                {item.jenisDokumen}
                              </td>
                              <td
                                className="truncate px-4 py-3 font-semibold text-gray-900"
                                title={item.namaDokumen}
                              >
                                {item.namaDokumen}
                              </td>
                              <td
                                className="truncate px-4 py-3 text-gray-600"
                                title={item.detailDokumen}
                              >
                                {item.detailDokumen}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {formatShortDate(item.tanggalInput)}
                              </td>
                              <td className="px-4 py-3 font-semibold text-gray-700">
                                {item.userInput.toUpperCase()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                        <SearchX className="h-8 w-8" aria-hidden="true" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">
                        {tableItems.length === 0 && tableSearchTerm.trim().length === 0
                          ? `Belum ada dokumen ${meta.label.toLowerCase()}`
                          : "Tidak ada data yang sesuai filter"}
                      </p>
                      <p className="mt-2 max-w-md text-sm text-gray-500">
                        Halaman laporan sudah siap. Data akan muncul di tabel ini setelah tersedia dari sumber data.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedPihakKetigaId(null);
                    setTableSearchTerm("");
                  }}
                  className="!border-gray-300 !bg-white !text-gray-700 !shadow-none hover:!bg-gray-50 hover:!shadow-none"
                >
                  Kembali
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {detailItem !== null ? (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setDetailPihakKetigaId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[74vh] w-[80vw] max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-xl font-bold text-gray-900">Detail Pihak Ketiga</h3>
              <button
                type="button"
                onClick={() => setDetailPihakKetigaId(null)}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup detail"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto px-5 py-5">
              <section>
                <h4 className="mb-3 text-base font-semibold uppercase tracking-wider text-gray-500">
                  Informasi Dokumen
                </h4>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {[
                    { label: "ID", value: `PTK-${detailItem.kodeDokumen}` },
                    { label: "Kode Dokumen", value: detailItem.kodeDokumen },
                    { label: "Nama Pihak Ketiga", value: detailItem.nama },
                    { label: "Kategori", value: meta.label },
                    { label: "Jenis Dokumen", value: detailItem.jenisDokumen },
                    { label: "Nama Dokumen", value: detailItem.namaDokumen },
                    { label: "Detail Dokumen", value: detailItem.detailDokumen },
                    { label: "Tanggal Input", value: formatShortDate(detailItem.tanggalInput) },
                    { label: "User Input", value: detailItem.userInput },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[180px_minmax(0,1fr)] gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0"
                    >
                      <p className="text-base text-gray-500">{row.label}</p>
                      <p className="text-right text-base font-semibold text-gray-900">{row.value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-base font-semibold uppercase tracking-wider text-gray-500">
                  Status Laporan
                </h4>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <p className="text-base text-gray-500">Proses Berjalan</p>
                    <p className="text-right text-base font-semibold text-gray-900">
                      {formatNumber(detailItem.prosesBerjalan)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <p className="text-base text-gray-500">Laporan Selesai</p>
                    <p className="text-right text-base font-semibold text-emerald-600">
                      {formatNumber(detailItem.laporanSelesai)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-base text-gray-500">Lewat Expired</p>
                    <p
                      className={`text-right text-base font-semibold ${
                        detailItem.lewatExpired > 0 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {formatNumber(detailItem.lewatExpired)}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-base font-semibold uppercase tracking-wider text-gray-500">
                  Lampiran
                </h4>
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-base text-gray-500">Dokumen</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openDocument(detailItem.fileUrl)}
                    className="!border-blue-300 !bg-white !text-blue-600 hover:!bg-blue-50"
                  >
                    <Eye className="mr-2 h-5 w-5" aria-hidden="true" />
                    View
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  return createPortal(modalContent, document.body);
}
