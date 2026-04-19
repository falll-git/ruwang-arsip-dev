"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileSignature,
  HeartPulse,
  Search,
  SearchX,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { pihakKetigaData, titipanNasabahData } from "@/lib/data";
import { formatRupiah } from "@/lib/utils/laporan";
import type {
  JenisTitipan,
  PihakKetigaKategori,
  TitipanNasabah,
} from "@/lib/types";

type SortOption = "SISA_DESC" | "SISA_ASC" | "NAME_ASC";

type TitipanGridItem = {
  id: string;
  nama: string;
  jumlahNasabah: number;
  totalTitipan: number;
  saldoTerbayar: number;
  sisaSaldo: number;
  isPlaceholder?: boolean;
};

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: "SISA_DESC", label: "Sisa Terbesar" },
  { value: "SISA_ASC", label: "Sisa Terkecil" },
  { value: "NAME_ASC", label: "A-Z" },
];

const defaultDocumentUrl = "/documents/contoh-dok.pdf";

const jenisMeta: Record<
  JenisTitipan,
  {
    icon: LucideIcon;
    label: string;
    title: string;
    accentClassName: string;
    badgeClassName: string;
    iconWrapperClassName: string;
  }
> = {
  NOTARIS: {
    icon: FileSignature,
    label: "Notaris",
    title: "Titipan Notaris",
    accentClassName: "text-sky-600",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    iconWrapperClassName: "border-sky-100 bg-sky-50 text-sky-600",
  },
  ASURANSI: {
    icon: HeartPulse,
    label: "Asuransi",
    title: "Titipan Asuransi",
    accentClassName: "text-emerald-600",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    iconWrapperClassName: "border-sky-100 bg-sky-50 text-sky-600",
  },
  ANGSURAN: {
    icon: Banknote,
    label: "Angsuran",
    title: "Titipan Angsuran",
    accentClassName: "text-amber-600",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    iconWrapperClassName: "border-sky-100 bg-sky-50 text-sky-600",
  },
};

function getKategoriFromJenisTitipan(
  jenisTitipan: JenisTitipan,
): PihakKetigaKategori | null {
  if (jenisTitipan === "NOTARIS") {
    return "NOTARIS";
  }

  if (jenisTitipan === "ASURANSI") {
    return "ASURANSI";
  }

  return null;
}

function calculateTitipanSummary(items: TitipanNasabah[]) {
  return items.reduce(
    (total, item) => ({
      totalTitipan: total.totalTitipan + item.totalTitipan,
      saldoTerbayar: total.saldoTerbayar + item.saldoTerbayar,
      sisaSaldo: total.sisaSaldo + item.sisaSaldo,
    }),
    {
      totalTitipan: 0,
      saldoTerbayar: 0,
      sisaSaldo: 0,
    },
  );
}

function openDocument(fileUrl?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const targetUrl = fileUrl && fileUrl.trim().length > 0 ? fileUrl : defaultDocumentUrl;
  window.open(targetUrl, "_blank", "noopener,noreferrer");
}

function TitipanGridCard({
  item,
  jenisTitipan,
  onSelect,
}: {
  item: TitipanGridItem;
  jenisTitipan: JenisTitipan;
  onSelect: (item: TitipanGridItem) => void;
}) {
  const meta = jenisMeta[jenisTitipan];
  const HeaderIcon = meta.icon;

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
          <HeaderIcon className="h-[18px] w-[18px] text-white" aria-hidden="true" />
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
            <Wallet className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
            <span className="truncate">Total Titipan</span>
          </span>
          <span className="shrink-0 font-semibold text-gray-900">
            {formatRupiah(item.totalTitipan)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-emerald-700">
            <CheckCircle2
              className="h-4 w-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <span className="truncate">Saldo Terbayar</span>
          </span>
          <span className="shrink-0 font-semibold text-emerald-600">
            {formatRupiah(item.saldoTerbayar)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span
            className={`flex min-w-0 items-center gap-2 ${
              item.sisaSaldo > 0 ? "text-red-600" : "text-emerald-700"
            }`}
          >
            <Clock3
              className={`h-4 w-4 shrink-0 ${
                item.sisaSaldo > 0 ? "text-red-600" : "text-emerald-600"
              }`}
              aria-hidden="true"
            />
            <span className="truncate">Sisa Saldo</span>
          </span>
          <span
            className={`shrink-0 font-semibold ${
              item.sisaSaldo > 0 ? "text-red-600" : "text-emerald-600"
            }`}
          >
            {item.sisaSaldo > 0 ? formatRupiah(item.sisaSaldo) : "Lunas"}
          </span>
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-sm font-semibold ${meta.accentClassName}`}
      >
        <span>{item.isPlaceholder ? "Buka Halaman" : "Lihat Nasabah"}</span>
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

export default function TitipanModal({
  jenisTitipan,
  onClose,
}: {
  jenisTitipan: JenisTitipan | null;
  onClose: () => void;
}) {
  const [selectedGridItemId, setSelectedGridItemId] = useState<string | null>(null);
  const [detailNasabahId, setDetailNasabahId] = useState<string | null>(null);
  const [entitySearchTerm, setEntitySearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("SISA_DESC");

  const modalOpen = jenisTitipan !== null;

  const handleClose = useCallback(() => {
    setSelectedGridItemId(null);
    setDetailNasabahId(null);
    setEntitySearchTerm("");
    setSearchTerm("");
    setSortOption("SISA_DESC");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!modalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (detailNasabahId !== null) {
          setDetailNasabahId(null);
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
  }, [detailNasabahId, handleClose, modalOpen]);

  const meta = jenisTitipan ? jenisMeta[jenisTitipan] : null;

  const gridItems = useMemo<TitipanGridItem[]>(() => {
    if (jenisTitipan === null) {
      return [];
    }

    if (jenisTitipan === "ANGSURAN") {
      const items = titipanNasabahData.filter(
        (item) => item.jenisTitipan === "ANGSURAN",
      );
      const summary = calculateTitipanSummary(items);

      return [
        {
          id: "angsuran",
          nama: "Daftar Titipan Angsuran",
          jumlahNasabah: items.length,
          totalTitipan: summary.totalTitipan,
          saldoTerbayar: summary.saldoTerbayar,
          sisaSaldo: summary.sisaSaldo,
          isPlaceholder: items.length === 0,
        },
      ];
    }

    const kategori = getKategoriFromJenisTitipan(jenisTitipan);

    const realGridItems = pihakKetigaData
      .filter((item) => item.kategori === kategori)
      .map((item) => {
        const nasabah = titipanNasabahData.filter(
          (entry) =>
            entry.jenisTitipan === jenisTitipan &&
            entry.pihakKetigaId === item.id,
        );
        const summary = calculateTitipanSummary(nasabah);

        return {
          id: item.id,
          nama: item.nama,
          jumlahNasabah: nasabah.length,
          totalTitipan: summary.totalTitipan,
          saldoTerbayar: summary.saldoTerbayar,
          sisaSaldo: summary.sisaSaldo,
        };
      });

    if (realGridItems.length > 0) {
      return realGridItems;
    }

    return [
      {
        id: `empty-${jenisTitipan.toLowerCase()}`,
        nama: `Daftar ${jenisMeta[jenisTitipan].title}`,
        jumlahNasabah: 0,
        totalTitipan: 0,
        saldoTerbayar: 0,
        sisaSaldo: 0,
        isPlaceholder: true,
      },
    ];
  }, [jenisTitipan]);

  const selectedGridItem = useMemo(
    () => gridItems.find((item) => item.id === selectedGridItemId) ?? null,
    [gridItems, selectedGridItemId],
  );

  const filteredGridItems = useMemo(() => {
    const keyword = entitySearchTerm.trim().toLowerCase();

    if (keyword.length === 0) {
      return gridItems;
    }

    return gridItems.filter((item) => item.nama.toLowerCase().includes(keyword));
  }, [entitySearchTerm, gridItems]);

  const detailItems = useMemo(() => {
    if (jenisTitipan === null || selectedGridItemId === null) {
      return [];
    }

    return titipanNasabahData.filter((item) => {
      if (item.jenisTitipan !== jenisTitipan) {
        return false;
      }

      if (jenisTitipan === "ANGSURAN") {
        return true;
      }

      return item.pihakKetigaId === selectedGridItemId;
    });
  }, [jenisTitipan, selectedGridItemId]);

  const detailNasabah = useMemo(
    () => detailItems.find((item) => item.id === detailNasabahId) ?? null,
    [detailItems, detailNasabahId],
  );

  const visibleNasabah = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return detailItems
      .filter((item) => keyword.length === 0 || item.nama.toLowerCase().includes(keyword))
      .sort((left, right) => {
        if (sortOption === "SISA_ASC") {
          if (left.sisaSaldo !== right.sisaSaldo) {
            return left.sisaSaldo - right.sisaSaldo;
          }

          return left.nama.localeCompare(right.nama, "id-ID");
        }

        if (sortOption === "NAME_ASC") {
          return left.nama.localeCompare(right.nama, "id-ID");
        }

        if (left.sisaSaldo !== right.sisaSaldo) {
          return right.sisaSaldo - left.sisaSaldo;
        }

        return left.nama.localeCompare(right.nama, "id-ID");
      });
  }, [detailItems, searchTerm, sortOption]);

  const tableSummary = useMemo(
    () => calculateTitipanSummary(visibleNasabah),
    [visibleNasabah],
  );

  if (jenisTitipan === null || meta === null) {
    return null;
  }

  const HeaderIcon = meta.icon;

  const modalContent = (
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
        {selectedGridItem === null ? (
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
                    <h3 className="text-xl font-bold text-gray-900">{meta.title}</h3>
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
                    <TitipanGridCard
                      key={item.id}
                      item={item}
                      jenisTitipan={jenisTitipan}
                      onSelect={(selected) => setSelectedGridItemId(selected.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                    <SearchX className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    Tidak ada grup titipan yang sesuai
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
                  onClick={() => {
                    setSelectedGridItemId(null);
                    setDetailNasabahId(null);
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate text-xl font-bold text-gray-900">
                      {selectedGridItem.nama}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${meta.badgeClassName}`}
                    >
                      {meta.label}
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
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
                  <div className="relative min-w-0">
                    <Search
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="input input-with-icon"
                      placeholder="Cari nama nasabah..."
                    />
                  </div>

                  <select
                    value={sortOption}
                    onChange={(event) =>
                      setSortOption(event.target.value as SortOption)
                    }
                    className="select"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Double click pada baris tabel untuk melihat detail.
                </p>
              </div>

              <div className="flex-1 overflow-auto p-0">
                {visibleNasabah.length > 0 ? (
                  <div className="w-full">
                    <table className="w-full table-fixed border-collapse text-left text-sm">
                    <colgroup>
                      <col className="w-[28%]" />
                      <col className="w-[16%]" />
                      <col className="w-[19%]" />
                      <col className="w-[19%]" />
                      <col className="w-[18%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10 border-b border-gray-100 bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Nama Nasabah
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Jenis Titipan
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Total Titipan
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Saldo Terbayar
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                          Sisa Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleNasabah.map((item) => (
                        <tr
                          key={item.id}
                          onDoubleClick={() => setDetailNasabahId(item.id)}
                          className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${
                            detailNasabahId === item.id ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <td className="px-6 py-4 align-top text-sm font-semibold text-gray-900">
                            <div className="truncate" title={item.nama}>
                              {item.nama}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center align-top text-sm text-gray-600">
                            {jenisMeta[item.jenisTitipan].label}
                          </td>
                          <td className="px-6 py-4 text-right align-top text-sm font-medium text-gray-700 tabular-nums">
                            {formatRupiah(item.totalTitipan)}
                          </td>
                          <td className="px-6 py-4 text-right align-top text-sm font-semibold text-emerald-600 tabular-nums">
                            {formatRupiah(item.saldoTerbayar)}
                          </td>
                          <td className="px-6 py-4 text-right align-top text-sm">
                            {item.sisaSaldo > 0 ? (
                              <span className="font-semibold text-red-600 tabular-nums">
                                {formatRupiah(item.sisaSaldo)}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Lunas
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-100 bg-gray-50">
                      <tr>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          Total
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          -
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900 tabular-nums">
                          {formatRupiah(tableSummary.totalTitipan)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600 tabular-nums">
                          {formatRupiah(tableSummary.saldoTerbayar)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-red-600 tabular-nums">
                          {formatRupiah(tableSummary.sisaSaldo)}
                        </td>
                      </tr>
                    </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-16 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                      <SearchX className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      {detailItems.length === 0 && searchTerm.trim().length === 0
                        ? `Belum ada nasabah ${meta.title.toLowerCase()}`
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
                  setSelectedGridItemId(null);
                  setDetailNasabahId(null);
                }}
                className="!border-gray-300 !bg-white !text-gray-700 !shadow-none hover:!bg-gray-50 hover:!shadow-none"
              >
                Kembali
              </Button>
            </div>
          </>
        )}
      </div>

      {detailNasabah !== null ? (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => setDetailNasabahId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex max-h-[74vh] w-[80vw] max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-xl font-bold text-gray-900">Detail Titipan Nasabah</h3>
              <button
                type="button"
                onClick={() => setDetailNasabahId(null)}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup detail"
              >
                <X className="h-7 w-7" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto px-5 py-5">
              <section>
                <h4 className="mb-3 text-base font-semibold uppercase tracking-wider text-gray-500">
                  Informasi Titipan
                </h4>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {[
                    { label: "ID", value: `TTP-${detailNasabah.id.toUpperCase()}` },
                    { label: "Nama Nasabah", value: detailNasabah.nama },
                    { label: "Jenis Titipan", value: jenisMeta[detailNasabah.jenisTitipan].label },
                    {
                      label: "Pihak Ketiga",
                      value:
                        detailNasabah.jenisTitipan === "ANGSURAN"
                          ? "-"
                          : selectedGridItem?.nama ?? "-",
                    },
                    { label: "Total Titipan", value: formatRupiah(detailNasabah.totalTitipan) },
                    { label: "Saldo Terbayar", value: formatRupiah(detailNasabah.saldoTerbayar) },
                    {
                      label: "Sisa Saldo",
                      value:
                        detailNasabah.sisaSaldo > 0
                          ? formatRupiah(detailNasabah.sisaSaldo)
                          : "Lunas",
                    },
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
                  Status Pembayaran
                </h4>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <p className="text-base text-gray-500">Total Titipan</p>
                    <p className="text-right text-base font-semibold text-gray-900">
                      {formatRupiah(detailNasabah.totalTitipan)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <p className="text-base text-gray-500">Saldo Terbayar</p>
                    <p className="text-right text-base font-semibold text-emerald-600">
                      {formatRupiah(detailNasabah.saldoTerbayar)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <p className="text-base text-gray-500">Sisa Saldo</p>
                    <p
                      className={`text-right text-base font-semibold ${
                        detailNasabah.sisaSaldo > 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {detailNasabah.sisaSaldo > 0
                        ? formatRupiah(detailNasabah.sisaSaldo)
                        : "Lunas"}
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-base font-semibold uppercase tracking-wider text-gray-500">
                  Lampiran
                </h4>
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <p className="text-base text-gray-500">Dokumen Titipan</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openDocument()}
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
    </div>
  );

  return createPortal(modalContent, document.body);
}
