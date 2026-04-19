"use client";

import { useMemo, useState } from "react";
import { Activity, Search, SearchX } from "lucide-react";

import {
  dummyActionPlan,
  dummyDebiturList,
  dummyHasilKunjungan,
  dummyLangkahPenanganan,
} from "@/lib/data";
import { formatDateDisplay, parseDateString } from "@/lib/utils/date";

type JenisAktivitas = "ACTION_PLAN" | "HASIL_KUNJUNGAN" | "LANGKAH_PENANGANAN";

type AktivitasFilter = "SEMUA" | JenisAktivitas;
type SortFilter = "TERBARU" | "TERLAMA";

type AktivitasMarketingItem = {
  id: string;
  tanggal: string;
  jenisAktivitas: JenisAktivitas;
  namaNasabah: string;
  sortTimestamp: number;
};

const aktivitasOptions: Array<{ value: AktivitasFilter; label: string }> = [
  { value: "SEMUA", label: "Semua Aktivitas" },
  { value: "ACTION_PLAN", label: "Action Plan" },
  { value: "HASIL_KUNJUNGAN", label: "Hasil Kunjungan" },
  { value: "LANGKAH_PENANGANAN", label: "Langkah Penanganan" },
];

const sortOptions: Array<{ value: SortFilter; label: string }> = [
  { value: "TERBARU", label: "Terbaru" },
  { value: "TERLAMA", label: "Terlama" },
];

const aktivitasBadgeMeta: Record<
  JenisAktivitas,
  { label: string; className: string }
> = {
  ACTION_PLAN: {
    label: "Action Plan",
    className: "bg-blue-100 text-blue-700",
  },
  HASIL_KUNJUNGAN: {
    label: "Hasil Kunjungan",
    className: "bg-amber-100 text-amber-700",
  },
  LANGKAH_PENANGANAN: {
    label: "Langkah Penanganan",
    className: "bg-green-100 text-green-700",
  },
};

function getDateTimestamp(value: string) {
  const parsed = parseDateString(value);
  if (!parsed) return 0;
  return parsed.getTime();
}

function formatDisplayDate(value: string) {
  return formatDateDisplay(value);
}

export default function LaporanAktivitasMarketingSection() {
  const [selectedAktivitas, setSelectedAktivitas] =
    useState<AktivitasFilter>("SEMUA");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortFilter>("TERBARU");

  const debiturNameMap = useMemo(
    () =>
      new Map(
        dummyDebiturList.map((item) => [item.id, item.namaNasabah] as const),
      ),
    [],
  );

  const aktivitasItems = useMemo<AktivitasMarketingItem[]>(() => {
    const getNasabahName = (debiturId: string) =>
      debiturNameMap.get(debiturId) ?? "-";

    const actionPlanItems: AktivitasMarketingItem[] = dummyActionPlan.map(
      (item) => ({
        id: `action-plan-${item.id}`,
        tanggal: item.tanggal,
        jenisAktivitas: "ACTION_PLAN",
        namaNasabah: getNasabahName(item.debiturId),
        sortTimestamp: getDateTimestamp(item.tanggal),
      }),
    );

    const hasilKunjunganItems: AktivitasMarketingItem[] =
      dummyHasilKunjungan.map((item) => ({
        id: `hasil-kunjungan-${item.id}`,
        tanggal: item.tanggalKunjungan,
        jenisAktivitas: "HASIL_KUNJUNGAN",
        namaNasabah: getNasabahName(item.debiturId),
        sortTimestamp: getDateTimestamp(item.tanggalKunjungan),
      }));

    const langkahPenangananItems: AktivitasMarketingItem[] =
      dummyLangkahPenanganan.map((item) => ({
        id: `langkah-penanganan-${item.id}`,
        tanggal: item.tanggal,
        jenisAktivitas: "LANGKAH_PENANGANAN",
        namaNasabah: getNasabahName(item.debiturId),
        sortTimestamp: getDateTimestamp(item.tanggal),
      }));

    return [
      ...actionPlanItems,
      ...hasilKunjunganItems,
      ...langkahPenangananItems,
    ];
  }, [debiturNameMap]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return aktivitasItems
      .filter((item) => {
        const matchesAktivitas =
          selectedAktivitas === "SEMUA" ||
          item.jenisAktivitas === selectedAktivitas;
        const matchesSearch =
          keyword.length === 0 ||
          item.namaNasabah.toLowerCase().includes(keyword);

        return matchesAktivitas && matchesSearch;
      })
      .sort((left, right) => {
        if (sortBy === "TERLAMA") {
          return left.sortTimestamp - right.sortTimestamp;
        }

        return right.sortTimestamp - left.sortTimestamp;
      });
  }, [aktivitasItems, searchTerm, selectedAktivitas, sortBy]);

  return (
    <section className="animate-fade-in">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <Activity className="h-6 w-6 text-gray-600" aria-hidden="true" />
          Laporan Aktivitas Marketing
        </h2>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-55 flex-1 sm:flex-none">
            <select
              value={selectedAktivitas}
              onChange={(event) =>
                setSelectedAktivitas(event.target.value as AktivitasFilter)
              }
              className="select"
              aria-label="Filter jenis aktivitas marketing"
            >
              {aktivitasOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-65 flex-2">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="input input-with-icon"
              placeholder="Cari nasabah..."
            />
          </div>

          <div className="min-w-37.5 flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortFilter)}
              className="select"
              aria-label="Urutan tanggal aktivitas marketing"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200">
          {filteredItems.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Aktivitas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Nasabah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => {
                  const aktivitasMeta = aktivitasBadgeMeta[item.jenisAktivitas];

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-700">
                        {formatDisplayDate(item.tanggal)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${aktivitasMeta.className}`}
                        >
                          {aktivitasMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.namaNasabah}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-55 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-300">
                <SearchX className="h-7 w-7" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Tidak ada aktivitas yang sesuai filter
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
