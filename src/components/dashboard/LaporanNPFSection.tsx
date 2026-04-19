"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  XCircle,
} from "lucide-react";

import DonutNPFChart from "@/components/charts/DonutNPFChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KolektibilitasTable from "@/components/dashboard/KolektibilitasTable";
import {
  kolektibilitasData,
  nasabahKolektibilitasData,
  npfKolektibilitasColors,
  riwayatNPFData,
} from "@/lib/data";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatRatio(value: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function getRatioTone(value: number) {
  if (value < 5) {
    return "text-emerald-600";
  }

  if (value <= 10) {
    return "text-amber-600";
  }

  return "text-red-600";
}

type RiwayatRange = 6 | 12;

const riwayatRangeOptions: Array<{ value: RiwayatRange; label: string }> = [
  { value: 6, label: "6 bulan terakhir" },
  { value: 12, label: "12 bulan terakhir" },
];

export default function LaporanNPFSection() {
  const [riwayatRange, setRiwayatRange] = useState<RiwayatRange>(6);
  const totalOutstanding = kolektibilitasData.reduce(
    (total, item) => total + item.outstandingPokok,
    0,
  );
  const bermasalahItems = kolektibilitasData.filter((item) => item.kol >= 3);
  const totalNasabahBermasalah = bermasalahItems.reduce(
    (total, item) => total + item.jumlahNasabah,
    0,
  );
  const totalOutstandingBermasalah = bermasalahItems.reduce(
    (total, item) => total + item.outstandingPokok,
    0,
  );
  const currentRatio =
    totalOutstanding === 0
      ? 0
      : Number(
          ((totalOutstandingBermasalah / totalOutstanding) * 100).toFixed(1),
        );
  const visibleRiwayat = [...riwayatNPFData]
    .sort((left, right) => {
      if (left.tahun !== right.tahun) {
        return right.tahun - left.tahun;
      }

      return right.bulan - left.bulan;
    })
    .slice(0, riwayatRange);
  const selectedRiwayatLabel =
    riwayatRangeOptions.find((option) => option.value === riwayatRange)
      ?.label ?? riwayatRangeOptions[0].label;

  const status =
    currentRatio < 5
      ? {
          icon: CheckCircle,
          classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
          text: "NPF dalam batas aman",
        }
      : currentRatio <= 10
        ? {
            icon: AlertTriangle,
            classes: "border-amber-200 bg-amber-50 text-amber-700",
            text: "NPF mendekati batas perhatian",
          }
        : {
            icon: XCircle,
            classes: "border-red-200 bg-red-50 text-red-700",
            text: "NPF melewati batas maksimum",
          };

  const StatusIcon = status.icon;

  return (
    <section className="animate-fade-in">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
          <TrendingDown className="h-6 w-6 text-gray-600" aria-hidden="true" />
          Laporan NPF
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Kolektibilitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <DonutNPFChart
              data={kolektibilitasData.map((item) => ({
                ...item,
                color: npfKolektibilitasColors[item.kol] ?? "#64748b",
              }))}
              ratio={currentRatio}
            />
            <KolektibilitasTable
              rows={kolektibilitasData}
              nasabah={nasabahKolektibilitasData}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <TrendingDown className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex min-h-11 items-center">
                  <CardTitle>Ringkasan NPF</CardTitle>
                </div>
              </div>

              <div className="w-full sm:w-52.5">
                <select
                  value={riwayatRange}
                  onChange={(event) =>
                    setRiwayatRange(Number(event.target.value) as RiwayatRange)
                  }
                  className="select border-gray-200 bg-white text-sm text-gray-700 shadow-sm"
                  aria-label="Pilih periode riwayat NPF"
                >
                  {riwayatRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className={`rounded-xl border p-4 ${status.classes}`}>
              <div className="flex items-center gap-3">
                <StatusIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-semibold">{status.text}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">
                  Total Nasabah Bermasalah (Kol 3-5)
                </span>
                <span className="font-semibold text-gray-900">
                  {formatNumber(totalNasabahBermasalah)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">
                  Total Outstanding Bermasalah
                </span>
                <span className="font-semibold text-gray-900">
                  {formatRupiah(totalOutstandingBermasalah)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-gray-500">Rasio NPF saat ini</span>
                <span className={`font-semibold ${getRatioTone(currentRatio)}`}>
                  {formatRatio(currentRatio)}%
                </span>
              </div>
            </div>

            <div className="h-px w-full bg-gray-200" />

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">
                  Riwayat NPF - {selectedRiwayatLabel}
                </h3>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div
                  className={
                    riwayatRange === 12 ? "max-h-90 overflow-y-auto" : undefined
                  }
                >
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Bulan Tahun
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Rasio NPF
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleRiwayat.map((item) => (
                        <tr
                          key={`${item.tahun}-${item.bulan}`}
                          className="transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-700">
                            {item.namaBulan} {item.tahun}
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-semibold ${getRatioTone(item.rasioNPF)}`}
                          >
                            {formatRatio(item.rasioNPF)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
