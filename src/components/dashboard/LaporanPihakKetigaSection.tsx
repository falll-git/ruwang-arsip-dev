"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Scale,
  Shield,
  Users2,
  type LucideIcon,
} from "lucide-react";

import PihakKetigaModal from "@/components/dashboard/PihakKetigaModal";
import { pihakKetigaSummary } from "@/lib/data";
import type { PihakKetigaKategori, PihakKetigaSummary } from "@/lib/types";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

const kategoriMeta: Record<
  PihakKetigaKategori,
  {
    icon: LucideIcon;
    label: string;
  }
> = {
  NOTARIS: {
    icon: Scale,
    label: "Notaris",
  },
  ASURANSI: {
    icon: Shield,
    label: "Asuransi",
  },
  KJPP: {
    icon: Building2,
    label: "KJPP",
  },
};

const defaultPihakKetigaSummary: PihakKetigaSummary[] = [
  {
    kategori: "NOTARIS",
    jumlahPihakKetiga: 0,
    prosesBerjalan: 0,
    laporanSelesai: 0,
    lewatExpired: 0,
  },
  {
    kategori: "ASURANSI",
    jumlahPihakKetiga: 0,
    prosesBerjalan: 0,
    laporanSelesai: 0,
    lewatExpired: 0,
  },
  {
    kategori: "KJPP",
    jumlahPihakKetiga: 0,
    prosesBerjalan: 0,
    laporanSelesai: 0,
    lewatExpired: 0,
  },
];

export default function LaporanPihakKetigaSection() {
  const [selectedKategori, setSelectedKategori] =
    useState<PihakKetigaKategori | null>(null);
  const summaryItems = defaultPihakKetigaSummary.map(
    (defaultItem) =>
      pihakKetigaSummary.find((item) => item.kategori === defaultItem.kategori) ??
      defaultItem,
  );

  return (
    <>
      <section className="animate-fade-in">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Users2 className="h-6 w-6 text-gray-600" aria-hidden="true" />
            Laporan Pihak Ketiga - Dokumen
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {summaryItems.map((item, index) => {
            const meta = kategoriMeta[item.kategori];
            const CategoryIcon = meta.icon;

            return (
              <button
                type="button"
                key={item.kategori}
                onClick={() => setSelectedKategori(item.kategori)}
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
                      <CategoryIcon
                        className="h-7 w-7 text-white"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-gray-900">
                        {meta.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-29.5 shrink-0 flex-col items-end text-right">
                    <span className="mb-1 text-xs font-semibold uppercase leading-tight tracking-wider text-gray-400">
                      Total Pihak Ketiga
                    </span>
                    <span className="text-2xl font-bold tabular-nums text-gray-800">
                      {formatNumber(item.jumlahPihakKetiga)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Activity
                        className="h-4 w-4 text-gray-500"
                        aria-hidden="true"
                      />
                      Proses Berjalan
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatNumber(item.prosesBerjalan)}
                    </span>
                  </div>
                  <div className="my-3 h-px w-full bg-gray-200" />
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex items-center gap-2 text-emerald-700">
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600"
                        aria-hidden="true"
                      />
                      Laporan Selesai
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatNumber(item.laporanSelesai)}
                    </span>
                  </div>
                  <div className="my-3 h-px w-full bg-gray-200" />
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span
                      className={
                        item.lewatExpired > 0
                          ? "flex items-center gap-2 text-red-600"
                          : "flex items-center gap-2 text-gray-400"
                      }
                    >
                      <AlertTriangle
                        className={
                          item.lewatExpired > 0
                            ? "h-4 w-4 text-red-600"
                            : "h-4 w-4 text-gray-400"
                        }
                        aria-hidden="true"
                      />
                      Lewat Expired
                    </span>
                    <span
                      className={
                        item.lewatExpired > 0
                          ? "font-semibold text-red-600"
                          : "font-semibold text-gray-400"
                      }
                    >
                      {formatNumber(item.lewatExpired)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between font-medium text-primary-600 transition-transform group-hover:translate-x-1">
                  <span className="text-sm">Lihat Detail</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <PihakKetigaModal
        kategori={selectedKategori}
        onClose={() => setSelectedKategori(null)}
      />
    </>
  );
}
