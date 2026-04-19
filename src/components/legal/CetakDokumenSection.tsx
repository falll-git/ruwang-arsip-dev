"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Printer, Search, SearchX } from "lucide-react";

import { cetakDokumenLegalData } from "@/lib/data";
import type { CetakDokumenLegalType, CetakDokumenRecord } from "@/lib/types";
import { formatDateDisplay, parseDateString } from "@/lib/utils/date";
import LegalViewButton from "@/components/legal/LegalViewButton";
import LaporanLegalDetailModal from "@/components/legal/LaporanLegalDetailModal";

type SortValue = "terbaru" | "terlama";
type JenisFilter = CetakDokumenLegalType | "SEMUA";

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
});

const jenisDokumenOptions: Array<{
  value: CetakDokumenLegalType;
  label: string;
}> = [
  { value: "AKAD", label: "Dokumen Akad" },
  { value: "HAFTSHEET", label: "Haftsheet" },
  { value: "SURAT_PERINGATAN", label: "Surat Peringatan" },
  { value: "FORMULIR_ASURANSI", label: "Formulir Asuransi" },
  { value: "SKL", label: "Surat Keterangan Lunas" },
  { value: "SAMSAT", label: "Surat Samsat" },
];

function formatLongDate(value: string) {
  return formatDateDisplay(value);
}

function getMonthKey(value: string) {
  const date = parseDateString(value);
  if (!date) return "";
  return String(date.getMonth() + 1).padStart(2, "0");
}

function getYearKey(value: string) {
  const date = parseDateString(value);
  if (!date) return "";
  return String(date.getFullYear());
}

function getCetakJenisLabel(value: CetakDokumenLegalType) {
  return (
    jenisDokumenOptions.find((item) => item.value === value)?.label ??
    value.replaceAll("_", " ")
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="text-lg font-medium text-gray-900">
        Tidak ada data yang sesuai filter
      </p>
    </div>
  );
}

export default function CetakDokumenSection() {
  const [activeJenis, setActiveJenis] = useState<JenisFilter>("SEMUA");
  const [keyword, setKeyword] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("SEMUA");
  const [selectedYear, setSelectedYear] = useState("SEMUA");
  const [sortValue, setSortValue] = useState<SortValue>("terbaru");
  const [selectedRecord, setSelectedRecord] = useState<CetakDokumenRecord | null>(
    null,
  );

  const availableYears = useMemo(
    () =>
      [...new Set(cetakDokumenLegalData.map((record) => getYearKey(record.tanggalCetak)))]
        .filter(Boolean)
        .sort((left, right) => Number(right) - Number(left)),
    [],
  );

  const visibleRecords = useMemo(() => {
    const loweredKeyword = keyword.trim().toLowerCase();

    return [...cetakDokumenLegalData]
      .filter((record) => {
        const matchesJenis =
          activeJenis === "SEMUA" || record.jenisDokumen === activeJenis;
        const matchesKeyword =
          loweredKeyword.length === 0 ||
          [
            record.namaNasabah,
            record.noKontrak,
            getCetakJenisLabel(record.jenisDokumen),
            record.dicetakOleh,
            record.keterangan ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(loweredKeyword);
        const matchesMonth =
          selectedMonth === "SEMUA" ||
          getMonthKey(record.tanggalCetak) === selectedMonth;
        const matchesYear =
          selectedYear === "SEMUA" || getYearKey(record.tanggalCetak) === selectedYear;

        return matchesJenis && matchesKeyword && matchesMonth && matchesYear;
      })
      .sort((left, right) => {
        const leftDate = parseDateString(left.tanggalCetak) ?? new Date(0);
        const rightDate = parseDateString(right.tanggalCetak) ?? new Date(0);

        if (sortValue === "terlama") {
          return leftDate.getTime() - rightDate.getTime();
        }

        return rightDate.getTime() - leftDate.getTime();
      });
  }, [activeJenis, keyword, selectedMonth, selectedYear, sortValue]);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d8fe1] to-[#0d5a8f] text-white shadow-md">
              <Printer className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Riwayat Cetak Dokumen
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Rekap cetak dokumen legal berdasarkan jenis, periode, dan user pencetak.
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Cari Data
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="input input-with-icon"
                  placeholder="Cari nama nasabah..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Filter Jenis
              </label>
              <select
                value={activeJenis}
                onChange={(event) => setActiveJenis(event.target.value as JenisFilter)}
                className="select"
              >
                <option value="SEMUA">Semua Jenis</option>
                {jenisDokumenOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="select"
              >
                <option value="SEMUA">Semua Bulan</option>
                {Array.from({ length: 12 }, (_, index) => {
                  const monthNumber = String(index + 1).padStart(2, "0");
                  const monthDate = new Date(2026, index, 1);

                  return (
                    <option key={monthNumber} value={monthNumber}>
                      {monthFormatter.format(monthDate)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="select"
              >
                <option value="SEMUA">Semua Tahun</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Urutkan
              </label>
              <div className="relative">
                <ArrowUpDown
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <select
                  value={sortValue}
                  onChange={(event) => setSortValue(event.target.value as SortValue)}
                  className="select input-with-icon"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="terlama">Terlama</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {visibleRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nama Nasabah
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Jenis Dokumen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tgl Cetak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Dicetak Oleh
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRecords.map((record, index) => (
                  <tr key={record.id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {record.namaNasabah}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {getCetakJenisLabel(record.jenisDokumen)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatLongDate(record.tanggalCetak)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {record.dicetakOleh}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <LegalViewButton
                          onClick={() => setSelectedRecord(record)}
                          title={`View detail ${record.namaNasabah}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <LaporanLegalDetailModal
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        title="Detail Cetak Dokumen"
        subtitle={
          selectedRecord
            ? `${selectedRecord.namaNasabah} | ${getCetakJenisLabel(selectedRecord.jenisDokumen)}`
            : undefined
        }
        sections={
          selectedRecord
            ? [
                {
                  title: "Informasi Cetak",
                  rows: [
                    { label: "Nama Nasabah", value: selectedRecord.namaNasabah },
                    { label: "No Kontrak", value: selectedRecord.noKontrak },
                    {
                      label: "Jenis Dokumen",
                      value: getCetakJenisLabel(selectedRecord.jenisDokumen),
                    },
                    {
                      label: "Tanggal Cetak",
                      value: formatLongDate(selectedRecord.tanggalCetak),
                    },
                    {
                      label: "Dicetak Oleh",
                      value: selectedRecord.dicetakOleh,
                    },
                    {
                      label: "Keterangan",
                      value: selectedRecord.keterangan ?? "-",
                    },
                  ],
                },
              ]
            : []
        }
      />
    </section>
  );
}
