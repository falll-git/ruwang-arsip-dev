"use client";

import { useMemo, useState } from "react";
import { FileSearch, Search, Trash2 } from "lucide-react";

import type { IdebRecord } from "@/lib/types";
import { formatInformasiDebiturDate } from "@/lib/utils/informasi-debitur";
import { Button } from "@/components/ui/button";
import DetailModal from "@/components/marketing/DetailModal";
import { renderIdebStatusBadge } from "@/components/legal/RingkasanIdebCard";

export default function IdebHistoryTable({
  records,
  onView,
  onDelete,
}: {
  records: IdebRecord[];
  onView: (record: IdebRecord) => void;
  onDelete?: (recordId: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [selectedYear, setSelectedYear] = useState("Semua Tahun");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [deleteTarget, setDeleteTarget] = useState<IdebRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const loweredKeyword = keyword.trim().toLowerCase();

    return records.filter((record) => {
      const matchesKeyword =
        loweredKeyword.length === 0 ||
        record.namaNasabah.toLowerCase().includes(loweredKeyword) ||
        record.noKontrak.toLowerCase().includes(loweredKeyword);
      const matchesYear =
        selectedYear === "Semua Tahun" || String(record.tahun) === selectedYear;
      const matchesStatus =
        selectedStatus === "Semua" || record.status === selectedStatus;

      return matchesKeyword && matchesYear && matchesStatus;
    });
  }, [keyword, records, selectedStatus, selectedYear]);

  return (
    <>
      <div
        className="rounded-xl bg-white p-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Riwayat Upload Ideb
            </h3>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3 lg:max-w-3xl">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Cari nama nasabah..."
                className="input input-with-icon"
              />
            </div>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className="select"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="select"
            >
              <option value="Semua">Semua</option>
              <option value="CHECKED">Checked</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <FileSearch
              className="mx-auto mb-3 h-10 w-10 text-gray-300"
              aria-hidden="true"
            />
            <h4 className="text-base font-semibold text-gray-900">
              Belum ada data IDEB yang diupload
            </h4>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Nasabah
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      No Kontrak
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Bulan
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Tahun
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Tgl Upload
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {record.namaNasabah}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {record.noKontrak}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {record.namaBulan}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {record.tahun}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatInformasiDebiturDate(record.tanggalUpload)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderIdebStatusBadge(record.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onView(record)}
                          >
                            Detail
                          </Button>
                          {onDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(record)}
                              className="h-9 w-9 px-0 !text-red-600 hover:!bg-red-50 hover:!text-red-700"
                              title={`Hapus riwayat ${record.namaNasabah}`}
                              aria-label={`Hapus riwayat ${record.namaNasabah}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {onDelete ? (
        <DetailModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Hapus Riwayat Ideb"
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-gray-600">
              Hapus riwayat upload IDEB untuk{" "}
              <span className="font-semibold text-gray-900">
                {deleteTarget?.namaNasabah}
              </span>{" "}
              periode {deleteTarget?.namaBulan} {deleteTarget?.tahun}?
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (!deleteTarget) return;
                  onDelete(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Hapus
              </Button>
            </div>
          </div>
        </DetailModal>
      ) : null}
    </>
  );
}
