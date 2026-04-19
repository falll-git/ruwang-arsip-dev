"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck,
  Search,
  SearchX,
} from "lucide-react";

import { progresPHK3Data } from "@/lib/data";
import type {
  ProgresPHK3Kategori,
  ProgresPHK3Record,
  ProgresPHK3Status,
} from "@/lib/types";
import { formatDateDisplay } from "@/lib/utils/date";
import LegalViewButton from "@/components/legal/LegalViewButton";
import LaporanLegalDetailModal from "@/components/legal/LaporanLegalDetailModal";

function formatLongDate(value: string) {
  return formatDateDisplay(value);
}

function renderStatusBadge(status: ProgresPHK3Status) {
  const classes =
    status === "SELESAI"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "AKTIF"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-gray-200 bg-gray-100 text-gray-600";

  const label =
    status === "SELESAI" ? "Selesai" : status === "AKTIF" ? "Aktif" : "Pending";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function renderKategoriBadge(kategori: ProgresPHK3Kategori) {
  const classes =
    kategori === "NOTARIS"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : kategori === "ASURANSI"
        ? "border-violet-200 bg-violet-50 text-violet-700"
        : "border-orange-200 bg-orange-50 text-orange-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {getKategoriLabel(kategori)}
    </span>
  );
}

function getKategoriLabel(kategori: ProgresPHK3Kategori) {
  return kategori === "NOTARIS"
    ? "Notaris"
    : kategori === "ASURANSI"
      ? "Asuransi"
      : "Tracking Claim";
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

export default function ProgresPHK3Section() {
  const [keyword, setKeyword] = useState("");
  const [selectedKategori, setSelectedKategori] = useState<
    ProgresPHK3Kategori | "SEMUA"
  >("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState<
    ProgresPHK3Status | "SEMUA"
  >("SEMUA");
  const [selectedRecord, setSelectedRecord] = useState<ProgresPHK3Record | null>(
    null,
  );

  const filteredRecords = useMemo(() => {
    const loweredKeyword = keyword.trim().toLowerCase();

    return progresPHK3Data.filter((record) => {
      const matchesKeyword =
        loweredKeyword.length === 0 ||
        [
          record.namaNasabah,
          record.noKontrak,
          getKategoriLabel(record.kategori),
          record.keterangan ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(loweredKeyword);
      const matchesKategori =
        selectedKategori === "SEMUA" || record.kategori === selectedKategori;
      const matchesStatus =
        selectedStatus === "SEMUA" || record.status === selectedStatus;

      return matchesKeyword && matchesKategori && matchesStatus;
    });
  }, [keyword, selectedKategori, selectedStatus]);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d8fe1] to-[#0d5a8f] text-white shadow-md">
              <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Riwayat Progres PHK3
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Pantau progres notaris, asuransi, dan tracking claim asuransi dalam satu tabel.
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                Filter Kategori
              </label>
              <select
                value={selectedKategori}
                onChange={(event) =>
                  setSelectedKategori(
                    event.target.value as ProgresPHK3Kategori | "SEMUA",
                  )
                }
                className="select"
              >
                <option value="SEMUA">Semua</option>
                <option value="NOTARIS">Notaris</option>
                <option value="ASURANSI">Asuransi</option>
                <option value="TRACKING_CLAIM">Tracking Claim</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Filter Status
              </label>
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(
                    event.target.value as ProgresPHK3Status | "SEMUA",
                  )
                }
                className="select"
              >
                <option value="SEMUA">Semua</option>
                <option value="AKTIF">Aktif</option>
                <option value="SELESAI">Selesai</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    No
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Nama Nasabah
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Kategori
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tgl Input
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Keterangan
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record, index) => (
                  <tr key={record.id} className="bg-white hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {record.namaNasabah}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderKategoriBadge(record.kategori)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatLongDate(record.tanggalInput)}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {record.keterangan ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <LegalViewButton
                          onClick={() => setSelectedRecord(record)}
                          title={`View detail ${record.namaNasabah}`}
                          className="!h-9"
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
        title="Detail Progres PHK3"
        subtitle={
          selectedRecord
            ? `${selectedRecord.namaNasabah} | ${getKategoriLabel(selectedRecord.kategori)}`
            : undefined
        }
        sections={
          selectedRecord
            ? [
                {
                  title: "Informasi Progres",
                  rows: [
                    { label: "Nama Nasabah", value: selectedRecord.namaNasabah },
                    { label: "No Kontrak", value: selectedRecord.noKontrak },
                    {
                      label: "Kategori",
                      value: getKategoriLabel(selectedRecord.kategori),
                    },
                    {
                      label: "Status",
                      value: renderStatusBadge(selectedRecord.status),
                    },
                    {
                      label: "Tanggal Input",
                      value: formatLongDate(selectedRecord.tanggalInput),
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
