"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileSearch,
  XCircle,
} from "lucide-react";

import { formatCurrency, getDebiturById } from "@/lib/data";
import type { IdebRecord } from "@/lib/types";
import { formatInformasiDebiturDate } from "@/lib/utils/informasi-debitur";
import KolBadge from "@/components/marketing/KolBadge";

export function renderIdebStatusBadge(status: IdebRecord["status"]) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
        status === "CHECKED"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-gray-200 bg-gray-100 text-gray-600"
      }`}
    >
      {status === "CHECKED" ? "Checked" : "Pending"}
    </span>
  );
}

export function renderIdebKesimpulanBadge(
  kesimpulan: "AMAN" | "PERHATIAN" | "BERMASALAH",
) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        kesimpulan === "AMAN"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : kesimpulan === "PERHATIAN"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {kesimpulan === "AMAN"
        ? "Aman"
        : kesimpulan === "PERHATIAN"
          ? "Perhatian"
          : "Bermasalah"}
    </span>
  );
}

function getKesimpulanMeta(kesimpulan: "AMAN" | "PERHATIAN" | "BERMASALAH") {
  if (kesimpulan === "AMAN") {
    return {
      icon: CheckCircle2,
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
      message:
        "Nasabah tidak memiliki catatan bermasalah di BPRS lain",
    };
  }

  if (kesimpulan === "PERHATIAN") {
    return {
      icon: AlertTriangle,
      classes: "border-amber-200 bg-amber-50 text-amber-700",
      message: "Nasabah memiliki catatan perhatian khusus",
    };
  }

  return {
    icon: XCircle,
    classes: "border-red-200 bg-red-50 text-red-700",
    message: "Nasabah memiliki catatan pembiayaan bermasalah",
  };
}

export default function RingkasanIdebCard({
  record,
  title = "Ringkasan Hasil Ideb",
  subtitle,
  actions,
  variant = "card",
}: {
  record: IdebRecord | null;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: "card" | "plain";
}) {
  if (!record) return null;

  const debitur = getDebiturById(record.debiturId);
  const ringkasan = record.ringkasan;
  const wrapperClassName =
    variant === "card"
      ? "rounded-xl bg-white p-6"
      : "";

  return (
    <div
      className={wrapperClassName}
      style={
        variant === "card"
          ? { boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }
          : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          <div className="space-y-2 text-sm text-gray-500 lg:text-right">
            <div>{renderIdebStatusBadge(record.status)}</div>
            <p>
              Diproses pada:{" "}
              <span className="font-medium text-gray-700">
                {formatInformasiDebiturDate(record.tanggalUpload)}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Nama Nasabah</p>
            <p className="mt-1 font-semibold text-gray-900">
              {record.namaNasabah}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">No Identitas (KTP)</p>
            <p className="mt-1 font-semibold text-gray-900">
              {debitur?.noIdentitas ?? "-"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">No Kontrak</p>
            <p className="mt-1 font-semibold text-gray-900">
              {record.noKontrak}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Kolektibilitas Berjalan</p>
            <div className="mt-2">
              {ringkasan ? (
                <KolBadge kol={String(ringkasan.kolektibilitasBerjalan)} />
              ) : (
                <span className="text-sm font-medium text-gray-500">-</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">OS Pokok</p>
            <p className="mt-1 font-semibold text-gray-900">
              {ringkasan ? formatCurrency(ringkasan.osPokok) : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Status Pembiayaan</p>
            <p className="mt-1 font-semibold text-gray-900">
              {ringkasan?.statusPembiayaan ?? "-"}
            </p>
          </div>
        </div>

        {record.status === "CHECKED" && ringkasan ? (
          <>
            <div className="space-y-3">
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  Riwayat Kolektibilitas di BPRS Lain
                </h4>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Nama BPRS
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Kolektibilitas
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          OS Pokok
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Periode
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ringkasan.riwayatBPRSLain.map((item, index) => (
                        <tr key={`${item.namaBPRS}-${item.periode}-${index}`}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.namaBPRS}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <KolBadge kol={String(item.kolektibilitas)} />
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(item.osPokok)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.periode}
                          </td>
                        </tr>
                      ))}
                      {ringkasan.riwayatBPRSLain.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-sm text-gray-500"
                          >
                            Tidak ada riwayat kolektibilitas di BPRS lain.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-900">
                Kesimpulan
              </h4>
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${getKesimpulanMeta(ringkasan.kesimpulan).classes}`}
              >
                {(() => {
                  const Icon = getKesimpulanMeta(ringkasan.kesimpulan).icon;
                  return <Icon className="mt-0.5 h-5 w-5 shrink-0" />;
                })()}
                <div className="space-y-1">
                  <div>{renderIdebKesimpulanBadge(ringkasan.kesimpulan)}</div>
                  <p className="text-sm font-medium">
                    {getKesimpulanMeta(ringkasan.kesimpulan).message}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <FileSearch
              className="mx-auto mb-3 h-10 w-10 text-gray-300"
              aria-hidden="true"
            />
            <h4 className="text-base font-semibold text-gray-900">
              Hasil IDEB belum tersedia
            </h4>
            <p className="mt-2 text-sm text-gray-500">
              Data untuk periode ini masih berstatus pending dan belum memiliki
              ringkasan hasil.
            </p>
          </div>
        )}

        {actions ? (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            {actions}
          </div>
        ) : null}

        {record.status === "CHECKED" && ringkasan ? (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            Periode pengecekan {record.namaBulan} {record.tahun}
          </div>
        ) : null}
      </div>
    </div>
  );
}
