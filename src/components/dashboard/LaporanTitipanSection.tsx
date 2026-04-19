"use client";

import { useState } from "react";
import {
  Banknote,
  CheckCircle,
  ChevronRight,
  Clock,
  FileSignature,
  HeartPulse,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import TitipanModal from "@/components/dashboard/TitipanModal";
import { titipanSummary } from "@/lib/data";
import type { JenisTitipan, TitipanSummary } from "@/lib/types";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const jenisMeta: Record<
  JenisTitipan,
  {
    icon: LucideIcon;
    title: string;
  }
> = {
  NOTARIS: {
    icon: FileSignature,
    title: "Titipan Notaris",
  },
  ASURANSI: {
    icon: HeartPulse,
    title: "Titipan Asuransi",
  },
  ANGSURAN: {
    icon: Banknote,
    title: "Titipan Angsuran",
  },
};

const defaultTitipanSummary: TitipanSummary[] = [
  {
    jenisTitipan: "NOTARIS",
    totalTitipan: 0,
    saldoTerbayar: 0,
    sisaSaldo: 0,
    jumlahNasabah: 0,
    lunas: true,
  },
  {
    jenisTitipan: "ASURANSI",
    totalTitipan: 0,
    saldoTerbayar: 0,
    sisaSaldo: 0,
    jumlahNasabah: 0,
    lunas: true,
  },
  {
    jenisTitipan: "ANGSURAN",
    totalTitipan: 0,
    saldoTerbayar: 0,
    sisaSaldo: 0,
    jumlahNasabah: 0,
    lunas: true,
  },
];

export default function LaporanTitipanSection() {
  const [selectedJenisTitipan, setSelectedJenisTitipan] = useState<JenisTitipan | null>(
    null,
  );
  const summaryItems = defaultTitipanSummary.map(
    (defaultItem) =>
      titipanSummary.find(
        (item) => item.jenisTitipan === defaultItem.jenisTitipan,
      ) ?? defaultItem,
  );

  return (
    <>
      <section className="animate-fade-in">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Wallet className="h-6 w-6 text-gray-600" aria-hidden="true" />
            Laporan Pihak Ketiga - Dana Titipan
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {summaryItems.map((item, index) => {
            const meta = jenisMeta[item.jenisTitipan];
            const SummaryIcon = meta.icon;

            return (
              <button
                type="button"
                key={item.jenisTitipan}
                onClick={() => setSelectedJenisTitipan(item.jenisTitipan)}
                className="group animate-slide-up rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-6 flex items-start gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110"
                      style={{
                        background:
                          "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
                      }}
                    >
                      <SummaryIcon className="h-7 w-7 text-white" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-gray-900">{meta.title}</p>
                    </div>
                  </div>

                  <div className="flex w-29.5 shrink-0 flex-col items-end text-right">
                    <span className="mb-1 text-xs font-semibold uppercase leading-tight tracking-wider text-gray-400">
                      Jumlah Nasabah
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-gray-800">
                      {formatNumber(item.jumlahNasabah)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Wallet className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      Total Titipan
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatRupiah(item.totalTitipan)}
                    </span>
                  </div>
                  <div className="my-3 h-px w-full bg-gray-200" />
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      Saldo Terbayar
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatRupiah(item.saldoTerbayar)}
                    </span>
                  </div>
                  <div className="my-3 h-px w-full bg-gray-200" />
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span
                      className={
                        item.sisaSaldo > 0
                          ? "flex items-center gap-2 text-red-600"
                          : "flex items-center gap-2 text-emerald-700"
                      }
                    >
                      <Clock
                        className={item.sisaSaldo > 0 ? "h-4 w-4 text-red-600" : "h-4 w-4 text-emerald-600"}
                        aria-hidden="true"
                      />
                      Sisa Saldo
                    </span>
                    {item.sisaSaldo > 0 ? (
                      <span className="font-semibold text-red-600">
                        {formatRupiah(item.sisaSaldo)}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600">Lunas</span>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between font-medium text-primary-600 transition-transform group-hover:translate-x-1">
                  <span className="text-sm">Lihat Nasabah</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <TitipanModal
        jenisTitipan={selectedJenisTitipan}
        onClose={() => setSelectedJenisTitipan(null)}
      />
    </>
  );
}
