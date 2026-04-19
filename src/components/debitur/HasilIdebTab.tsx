"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileSearch } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import type { IdebRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatInformasiDebiturDate } from "@/lib/utils/informasi-debitur";
import HasilIdebDetailModal from "@/components/debitur/HasilIdebDetailModal";
import {
  renderIdebKesimpulanBadge,
  renderIdebStatusBadge,
} from "@/components/legal/RingkasanIdebCard";
import { getMergedIdebRecords } from "@/components/legal/ideb-storage";
import { hasDashboardCapability } from "@/lib/rbac";

interface HasilIdebTabProps {
  debiturId: string;
}

export default function HasilIdebTab({
  debiturId,
}: HasilIdebTabProps): React.JSX.Element {
  const { role, status, user } = useAuth();
  const [records, setRecords] = useState<IdebRecord[]>(() => getMergedIdebRecords());
  const [selectedRecord, setSelectedRecord] = useState<IdebRecord | null>(null);
  const canUploadIdeb =
    status === "authenticated" &&
    role !== null &&
    hasDashboardCapability(
      "/dashboard/legal/upload-ideb",
      role,
      user?.role_id,
      "create",
    );

  useEffect(() => {
    const refreshRecords = () => {
      setRecords(getMergedIdebRecords());
    };

    refreshRecords();
    window.addEventListener("storage", refreshRecords);
    return () => window.removeEventListener("storage", refreshRecords);
  }, []);

  const filteredRecords = useMemo(
    () => records.filter((record) => record.debiturId === debiturId),
    [debiturId, records],
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Riwayat Pengecekan Ideb
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Riwayat upload dan hasil pengecekan IDEB nasabah.
          </p>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <FileSearch
              className="mx-auto mb-3 h-10 w-10 text-gray-300"
              aria-hidden="true"
            />
            <h4 className="text-base font-semibold text-gray-900">
              Belum ada data IDEB
            </h4>
            <p className="mt-2 text-sm text-gray-500">
              Upload data IDEB untuk melihat ringkasan hasil pengecekan nasabah.
            </p>
            {canUploadIdeb ? (
              <div className="mt-5">
                <Button asChild variant="upload">
                  <Link href="/dashboard/legal/upload-ideb">Upload Ideb</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                      Kesimpulan
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record, index) => (
                    <tr
                      key={record.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
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
                      <td className="px-4 py-3 text-center">
                        {record.ringkasan ? (
                          renderIdebKesimpulanBadge(record.ringkasan.kesimpulan)
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRecord(record);
                            }}
                          >
                            Detail
                          </Button>
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

      <HasilIdebDetailModal
        isOpen={Boolean(selectedRecord)}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
}
