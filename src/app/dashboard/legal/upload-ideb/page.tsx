"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSearch, RotateCcw, Save } from "lucide-react";

import {
  buildIdebRingkasanByDebiturId,
  dummyDebiturList,
  getDebiturById,
} from "@/lib/data";
import type { IdebRecord } from "@/lib/types";
import { todayIsoDate } from "@/lib/utils/date";
import { Button } from "@/components/ui/button";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { useAppToast } from "@/components/ui/AppToastProvider";
import HasilIdebDetailModal from "@/components/debitur/HasilIdebDetailModal";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import IdebHistoryTable from "@/components/legal/IdebHistoryTable";
import RingkasanIdebCard from "@/components/legal/RingkasanIdebCard";
import UploadIdebForm, {
  type UploadIdebFormPayload,
} from "@/components/legal/UploadIdebForm";
import {
  getMergedIdebRecords,
  persistIdebRecord,
  removeIdebRecord,
} from "@/components/legal/ideb-storage";

export default function UploadIdebPage() {
  const { showToast } = useAppToast();
  const { ensureCapability, hasCapability } = useProtectedAction();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const canCreateUploadIdeb = hasCapability(
    "/dashboard/legal/upload-ideb",
    "create",
  );
  const canDeleteUploadIdeb = hasCapability(
    "/dashboard/legal/upload-ideb",
    "delete",
  );
  const [records, setRecords] = useState<IdebRecord[]>([]);
  const [currentResult, setCurrentResult] = useState<IdebRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<IdebRecord | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const refreshRecords = () => {
      setRecords(getMergedIdebRecords());
    };

    refreshRecords();
    window.addEventListener("storage", refreshRecords);
    return () => window.removeEventListener("storage", refreshRecords);
  }, []);

  useEffect(() => {
    if (!currentResult || !resultRef.current) return;

    resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentResult]);

  const isCurrentResultSaved = useMemo(
    () =>
      currentResult
        ? records.some((record) => record.id === currentResult.id)
        : false,
    [currentResult, records],
  );

  const handleProcessed = (payload: UploadIdebFormPayload) => {
    if (!ensureCapability("/dashboard/legal/upload-ideb", "create")) return;

    const debitur = getDebiturById(payload.debiturId);
    if (!debitur) {
      showToast("Data nasabah tidak ditemukan", "error");
      return;
    }

    const ringkasan = buildIdebRingkasanByDebiturId(payload.debiturId);
    const result: IdebRecord = {
      id: `IDEB-UPLOAD-${Date.now()}`,
      debiturId: debitur.id,
      namaNasabah: debitur.namaNasabah,
      noKontrak: debitur.noKontrak,
      bulan: payload.bulan,
      namaBulan: payload.namaBulan,
      tahun: payload.tahun,
      tanggalUpload: todayIsoDate(),
      status: "CHECKED",
      ringkasan,
    };

    setCurrentResult(result);
  };

  const handleSaveResult = () => {
    if (!ensureCapability("/dashboard/legal/upload-ideb", "create")) return;
    if (!currentResult) return;

    persistIdebRecord(currentResult);
    const nextRecords = getMergedIdebRecords();
    setRecords(nextRecords);
    setCurrentResult(currentResult);
    showToast("Hasil IDEB berhasil disimpan", "success");
  };

  const handleReset = () => {
    setCurrentResult(null);
    setFormKey((prev) => prev + 1);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!ensureCapability("/dashboard/legal/upload-ideb", "delete")) return;
    removeIdebRecord(recordId);
    const nextRecords = getMergedIdebRecords();
    setRecords(nextRecords);
    setCurrentResult((prev) => (prev?.id === recordId ? null : prev));
    setSelectedRecord((prev) => (prev?.id === recordId ? null : prev));
    showToast("Riwayat IDEB berhasil dihapus", "success");
  };

  return (
    <>
      <div className="space-y-6">
        <FeatureHeader
          title="Upload Ideb"
          subtitle="Upload data IDEB nasabah dan lihat ringkasan hasil pengecekan."
          icon={<FileSearch />}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <UploadIdebForm
            key={formKey}
            options={dummyDebiturList}
            onProcessed={handleProcessed}
            disabled={!canCreateUploadIdeb}
          />

          <div ref={resultRef}>
            {currentResult ? (
              <RingkasanIdebCard
                record={currentResult}
                subtitle={`Nasabah: ${currentResult.namaNasabah} | ${currentResult.namaBulan} ${currentResult.tahun}`}
                actions={
                  <>
                    <Button
                      type="button"
                      onClick={handleSaveResult}
                      disabled={isCurrentResultSaved || !canCreateUploadIdeb}
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      {isCurrentResultSaved ? "Sudah Disimpan" : "Simpan Hasil"}
                    </Button>
                    <Button
                      type="button"
                      variant="pdf"
                      onClick={() =>
                        showToast("Export PDF berhasil diproses", "success")
                      }
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Export PDF
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      Reset
                    </Button>
                  </>
                }
              />
            ) : (
              <div
                className="rounded-xl bg-white p-6"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  Ringkasan Hasil Ideb
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Hasil pengecekan akan muncul setelah file berhasil diproses.
                </p>
                <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                  <FileSearch
                    className="mx-auto mb-3 h-12 w-12 text-gray-300"
                    aria-hidden="true"
                  />
                  <h4 className="text-base font-semibold text-gray-900">
                    Belum ada hasil IDEB
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    Pilih nasabah, periode, lalu upload file IDEB untuk melihat
                    ringkasan hasil pengecekan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <IdebHistoryTable
          records={records}
          onView={setSelectedRecord}
          onDelete={canDeleteUploadIdeb ? handleDeleteRecord : undefined}
        />
      </div>

      <HasilIdebDetailModal
        isOpen={Boolean(selectedRecord)}
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </>
  );
}
