"use client";

import { Download } from "lucide-react";

import type { IdebRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/components/ui/AppToastProvider";
import DetailModal from "@/components/marketing/DetailModal";
import RingkasanIdebCard from "@/components/legal/RingkasanIdebCard";

export default function HasilIdebDetailModal({
  isOpen,
  record,
  onClose,
}: {
  isOpen: boolean;
  record: IdebRecord | null;
  onClose: () => void;
}) {
  const { showToast } = useAppToast();

  if (!record) return null;

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Hasil Ideb - ${record.namaNasabah} | ${record.namaBulan} ${record.tahun}`}
    >
      <RingkasanIdebCard record={record} variant="plain" />
      <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="pdf"
          onClick={() => showToast("Export PDF berhasil diproses", "success")}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export PDF
        </Button>
      </div>
    </DetailModal>
  );
}
