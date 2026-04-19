"use client";

import { Clock3, MapPin, User } from "lucide-react";
import { useMemo, useState } from "react";

import type {
  ActionPlan,
  HasilKunjungan,
  LangkahPenanganan,
} from "@/lib/types/modul3";
import { parseDateString } from "@/lib/utils/date";
import {
  formatInformasiDebiturDate,
  getDebiturDocumentPreviewType,
  normalizeDebiturDocumentUrl,
} from "@/lib/utils/informasi-debitur";
import DetailModal, {
  DetailRow,
  DetailSection,
} from "@/components/marketing/DetailModal";
import StatusBadge from "@/components/marketing/StatusBadge";
import DebiturViewButton from "@/components/debitur/DebiturViewButton";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";

type RowId = "action-plan" | "hasil-kunjungan" | "langkah-penanganan";

type TimelineEntry =
  | {
      id: string;
      rowId: "action-plan";
      title: string;
      date: string;
      summary: string;
      detail: string;
      status?: ActionPlan["status"];
      createdBy: string;
      targetDate?: string;
      timelineGroupId?: string;
      attachmentPath?: string;
      attachmentName?: string;
      attachmentType?: "pdf" | "jpg" | "png" | "image";
    }
  | {
      id: string;
      rowId: "hasil-kunjungan";
      title: string;
      date: string;
      summary: string;
      detail: string;
      status?: HasilKunjungan["status"];
      createdBy: string;
      alamat?: string;
      timelineGroupId?: string;
      attachmentPath?: string;
      attachmentName?: string;
      attachmentType?: "pdf" | "jpg" | "png" | "image";
    }
  | {
      id: string;
      rowId: "langkah-penanganan";
      title: string;
      date: string;
      summary: string;
      detail: string;
      status?: LangkahPenanganan["status"];
      createdBy: string;
      timelineGroupId?: string;
      attachmentPath?: string;
      attachmentName?: string;
      attachmentType?: "pdf" | "jpg" | "png" | "image";
    };

const ROW_META: Record<
  RowId,
  {
    label: string;
    chipClasses: string;
    lineClasses: string;
    emptyClasses: string;
  }
> = {
  "action-plan": {
    label: "Action Plan",
    chipClasses: "border-sky-200 bg-sky-50 text-sky-900",
    lineClasses: "bg-sky-100",
    emptyClasses: "text-sky-300",
  },
  "hasil-kunjungan": {
    label: "Hasil Kunjungan",
    chipClasses: "border-amber-200 bg-amber-50 text-amber-900",
    lineClasses: "bg-amber-100",
    emptyClasses: "text-amber-300",
  },
  "langkah-penanganan": {
    label: "Langkah Penanganan",
    chipClasses: "border-emerald-200 bg-emerald-50 text-emerald-900",
    lineClasses: "bg-emerald-100",
    emptyClasses: "text-emerald-300",
  },
};

const ROW_IDS = Object.keys(ROW_META) as RowId[];

function toTimestamp(value: string) {
  return parseDateString(value)?.getTime() ?? 0;
}

function getNearestLinkedAction(
  langkah: LangkahPenanganan,
  actionPlans: ActionPlan[],
) {
  if (langkah.timelineGroupId) {
    return (
      actionPlans.find((item) => item.timelineGroupId === langkah.timelineGroupId) ??
      null
    );
  }

  const langkahTime = toTimestamp(langkah.tanggal);
  return (
    actionPlans
      .filter((item) => toTimestamp(item.tanggal) <= langkahTime)
      .sort(
        (left, right) =>
          Math.abs(langkahTime - toTimestamp(left.tanggal)) -
          Math.abs(langkahTime - toTimestamp(right.tanggal)),
      )[0] ?? null
  );
}

function getNearestLinkedLangkah(
  actionPlan: ActionPlan,
  langkahPenanganan: LangkahPenanganan[],
) {
  if (actionPlan.timelineGroupId) {
    return (
      langkahPenanganan.find(
        (item) => item.timelineGroupId === actionPlan.timelineGroupId,
      ) ?? null
    );
  }

  const actionTime = toTimestamp(actionPlan.tanggal);
  return (
    langkahPenanganan
      .filter((item) => toTimestamp(item.tanggal) >= actionTime)
      .sort(
        (left, right) =>
          Math.abs(toTimestamp(left.tanggal) - actionTime) -
          Math.abs(toTimestamp(right.tanggal) - actionTime),
      )[0] ?? null
  );
}

function renderTimelineBadge(entry: TimelineEntry) {
  if (!entry.status) return null;

  if (entry.rowId === "hasil-kunjungan") {
    const badgeClasses =
      entry.status === "Positif"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : entry.status === "Negatif"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-gray-200 bg-gray-100 text-gray-700";

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeClasses}`}
      >
        {entry.status}
      </span>
    );
  }

  return <StatusBadge status={entry.status} />;
}

export default function LaporanSummaryTimeline({
  actionPlans,
  hasilKunjungans,
  langkahPenanganans,
}: {
  actionPlans: ActionPlan[];
  hasilKunjungans: HasilKunjungan[];
  langkahPenanganans: LangkahPenanganan[];
}) {
  const { openPreview } = useDocumentPreviewContext();
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);

  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    return [
      ...actionPlans.map((item) => ({
        id: item.id,
        rowId: "action-plan" as const,
        title: "Action Plan",
        date: item.tanggal,
        summary: item.rencana,
        detail: item.rencana,
        status: item.status,
        createdBy: item.createdBy,
        targetDate: item.targetTanggal,
        timelineGroupId: item.timelineGroupId,
        attachmentPath: item.lampiranFilePath,
        attachmentName: item.lampiranFileName,
        attachmentType: item.lampiranFileType,
      })),
      ...hasilKunjungans.map((item) => ({
        id: item.id,
        rowId: "hasil-kunjungan" as const,
        title: "Hasil Kunjungan",
        date: item.tanggalKunjungan,
        summary: item.hasilKunjungan,
        detail: item.kesimpulan,
        status: item.status,
        createdBy: item.createdBy,
        alamat: item.alamat,
        timelineGroupId: item.timelineGroupId,
        attachmentPath: item.fotoKunjungan,
        attachmentName: item.fotoKunjunganNama,
        attachmentType: item.fotoKunjunganTipe,
      })),
      ...langkahPenanganans.map((item) => ({
        id: item.id,
        rowId: "langkah-penanganan" as const,
        title: "Langkah Penanganan",
        date: item.tanggal,
        summary: item.langkah,
        detail: item.hasilPenanganan,
        status: item.status,
        createdBy: item.createdBy,
        timelineGroupId: item.timelineGroupId,
        attachmentPath: item.lampiranFilePath,
        attachmentName: item.lampiranFileName,
        attachmentType: item.lampiranFileType,
      })),
    ].sort((left, right) => toTimestamp(left.date) - toTimestamp(right.date));
  }, [actionPlans, hasilKunjungans, langkahPenanganans]);

  const dates = useMemo(
    () =>
      Array.from(new Set(timelineEntries.map((entry) => entry.date))).sort(
        (left, right) => toTimestamp(left) - toTimestamp(right),
      ),
    [timelineEntries],
  );

  const latestDate = dates[dates.length - 1] ?? "";

  const unresolvedActionDates = useMemo(() => {
    return new Set(
      actionPlans
        .filter((item) => !getNearestLinkedLangkah(item, langkahPenanganans))
        .map((item) => item.tanggal),
    );
  }, [actionPlans, langkahPenanganans]);

  if (timelineEntries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Belum ada histori penanganan
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Timeline penanganan debitur akan tampil setelah ada aktivitas.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="relative isolate space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Laporan Summary
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Timeline progres penanganan debitur dari action plan sampai
            realisasi terakhir.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-[14rem_minmax(0,1fr)] overflow-hidden">
            <div className="border-r border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-white px-5 py-4 shadow-[8px_0_16px_-16px_rgba(15,23,42,0.3)]">
                <p className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Aktivitas
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {ROW_IDS.map((rowId) => (
                  <div
                    key={rowId}
                    className="flex min-h-[188px] items-start bg-white px-5 py-5 shadow-[8px_0_16px_-16px_rgba(15,23,42,0.3)]"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {ROW_META[rowId].label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rowId === "action-plan"
                          ? "Rencana tindak lanjut"
                          : rowId === "hasil-kunjungan"
                            ? "Ringkasan hasil lapangan"
                            : "Eksekusi penanganan"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-max">
                <div
                  className="grid border-b border-gray-200 bg-gray-50"
                  style={{
                    gridTemplateColumns: dates
                      .map(() => "minmax(16rem, 16rem)")
                      .join(" "),
                  }}
                >
                  {dates.map((date) => (
                    <div
                      key={date}
                      className="border-r border-gray-200 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 last:border-r-0"
                    >
                      {formatInformasiDebiturDate(date)}
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-gray-100">
                  {ROW_IDS.map((rowId) => (
                    <div
                      key={rowId}
                      className="relative grid min-h-[188px]"
                      style={{
                        gridTemplateColumns: dates
                          .map(() => "minmax(16rem, 16rem)")
                          .join(" "),
                      }}
                    >
                      <div
                        className={`pointer-events-none absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 ${ROW_META[rowId].lineClasses}`}
                      />

                      {dates.map((date) => {
                        const items = timelineEntries.filter(
                          (entry) => entry.rowId === rowId && entry.date === date,
                        );
                        const showPendingIndicator =
                          rowId === "langkah-penanganan" &&
                          items.length === 0 &&
                          unresolvedActionDates.has(date);

                        return (
                          <div
                            key={`${rowId}-${date}`}
                            className="relative border-r border-gray-100 bg-white px-5 py-5 last:border-r-0"
                          >
                            <div className="relative z-10 space-y-3">
                              {items.map((entry) => {
                                const linkedLangkah =
                                  entry.rowId === "action-plan"
                                    ? getNearestLinkedLangkah(
                                        actionPlans.find(
                                          (item) => item.id === entry.id,
                                        )!,
                                        langkahPenanganans,
                                      )
                                    : null;
                                const linkedAction =
                                  entry.rowId === "langkah-penanganan"
                                    ? getNearestLinkedAction(
                                        langkahPenanganans.find(
                                          (item) => item.id === entry.id,
                                        )!,
                                        actionPlans,
                                      )
                                    : null;
                                const isLatest = entry.date === latestDate;

                                return (
                                  <button
                                    key={entry.id}
                                    type="button"
                                    title={`${entry.summary} - ${entry.detail}`}
                                    onClick={() => setSelectedEntry(entry)}
                                    className={`w-full rounded-2xl border px-4 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${ROW_META[entry.rowId].chipClasses} ${isLatest ? "ring-2 ring-offset-1 ring-[#157ec3]/20" : ""}`}
                                  >
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                      {formatInformasiDebiturDate(entry.date)}
                                    </p>
                                    <p
                                      className="mt-2 text-sm font-semibold leading-5"
                                      style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {entry.summary}
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                      {renderTimelineBadge(entry)}
                                      {entry.rowId === "action-plan" ? (
                                        <span className="text-[11px] font-medium text-sky-700">
                                          {linkedLangkah
                                            ? `Realisasi ${formatInformasiDebiturDate(linkedLangkah.tanggal)}`
                                            : "Belum ada realisasi"}
                                        </span>
                                      ) : null}
                                      {entry.rowId === "langkah-penanganan" &&
                                      linkedAction ? (
                                        <span className="text-[11px] font-medium text-emerald-700">
                                          Terkait{" "}
                                          {formatInformasiDebiturDate(
                                            linkedAction.tanggal,
                                          )}
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
                                );
                              })}

                              {showPendingIndicator ? (
                                <div className="inline-flex rounded-full border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-500">
                                  Belum ada realisasi
                                </div>
                              ) : null}

                              {items.length === 0 && !showPendingIndicator ? (
                                <div
                                  className={`inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-medium ${ROW_META[rowId].emptyClasses}`}
                                >
                                  -
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetailModal
        isOpen={selectedEntry !== null}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry?.title ?? "Detail Aktivitas"}
      >
        {selectedEntry ? (
          <div className="space-y-5">
            <DetailSection title="Ringkasan Aktivitas">
              <DetailRow
                label="Tanggal"
                value={formatInformasiDebiturDate(selectedEntry.date)}
              />
              <DetailRow label="Ringkasan" value={selectedEntry.summary} />
              <DetailRow label="Detail" value={selectedEntry.detail} />
              {selectedEntry.status ? (
                <DetailRow
                  label="Status"
                  value={renderTimelineBadge(selectedEntry)}
                />
              ) : null}
            </DetailSection>

            <DetailSection title="Informasi Tambahan">
              <DetailRow
                label="Input Oleh"
                value={
                  <span className="inline-flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    {selectedEntry.createdBy}
                  </span>
                }
              />
              {"targetDate" in selectedEntry && selectedEntry.targetDate ? (
                <DetailRow
                  label="Target Tanggal"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <Clock3
                        className="h-4 w-4 text-gray-400"
                        aria-hidden="true"
                      />
                      {formatInformasiDebiturDate(selectedEntry.targetDate)}
                    </span>
                  }
                />
              ) : null}
              {"alamat" in selectedEntry && selectedEntry.alamat ? (
                <DetailRow
                  label="Alamat Kunjungan"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <MapPin
                        className="h-4 w-4 text-gray-400"
                        aria-hidden="true"
                      />
                      {selectedEntry.alamat}
                    </span>
                  }
                />
              ) : null}
              {selectedEntry.timelineGroupId ? (
                <DetailRow
                  label="Referensi Timeline"
                  value={selectedEntry.timelineGroupId}
                />
              ) : null}
            </DetailSection>

            {selectedEntry.attachmentPath ? (
              <DetailSection title="Lampiran">
                <DetailRow
                  label="Nama Dokumen"
                  value={selectedEntry.attachmentName ?? "Lampiran aktivitas"}
                />
                <DetailRow
                  label="Aksi"
                  value={
                    <DebiturViewButton
                      onClick={() =>
                        openPreview(
                          normalizeDebiturDocumentUrl(selectedEntry.attachmentPath!),
                          selectedEntry.attachmentName ?? "lampiran-aktivitas.pdf",
                          getDebiturDocumentPreviewType(
                            selectedEntry.attachmentPath!,
                            selectedEntry.attachmentType,
                          ),
                        )
                      }
                    />
                  }
                />
              </DetailSection>
            ) : null}
          </div>
        ) : null}
      </DetailModal>
    </>
  );
}
