"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, UserX, Wallet } from "lucide-react";
import {
  dummyDokumen,
  getDebiturById,
  getHistorisKolektibilitasByDebiturId,
  getDokumenByDebiturId,
  getNotarisByDebiturId,
  getActionPlanByDebiturId,
  getHasilKunjunganByDebiturId,
  getLangkahPenangananByDebiturId,
  getSuratPeringatanByDebiturId,
  getKlaimAsuransiByNoKontrak,
  getSaldoDanaTitipanByNoKontrak,
  getHistorisTitipanByNoKontrak,
  formatCurrency,
  getKolektibilitasLabel,
  getKolektibilitasColor,
} from "@/lib/data";
import { useAuth } from "@/components/auth/AuthProvider";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import FeatureHeader from "@/components/ui/FeatureHeader";
import DebiturViewButton from "@/components/debitur/DebiturViewButton";
import DokumenDebiturSection from "@/components/debitur/DokumenDebiturSection";
import HasilIdebTab from "@/components/debitur/HasilIdebTab";
import LaporanSummaryTimeline from "@/components/debitur/LaporanSummaryTimeline";
import { filterDigitalDocuments, getDashboardRouteDecision } from "@/lib/rbac";
import {
  formatInformasiDebiturDate,
  normalizeDebiturDocumentUrl,
} from "@/lib/utils/informasi-debitur";

type TabType =
  | "info"
  | "summary"
  | "bprs"
  | "historis"
  | "dokumen"
  | "notaris"
  | "sp"
  | "klaim"
  | "titipan";

const ALL_TABS: { id: TabType; label: string }[] = [
  { id: "info", label: "Data Utama" },
  { id: "summary", label: "Laporan Summary" },
  { id: "bprs", label: "Hasil Ideb" },
  { id: "historis", label: "Historis Kol" },
  { id: "dokumen", label: "Dokumen" },
  { id: "notaris", label: "Notaris" },
  { id: "sp", label: "Surat Peringatan" },
  { id: "klaim", label: "Progress Claim Asuransi" },
  { id: "titipan", label: "Dana Titipan" },
];

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="py-3 border-b border-gray-100 last:border-0">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className="font-medium text-gray-900">{value}</p>
  </div>
);

export default function DetailDebiturPage() {
  const { id } = useParams();
  const router = useRouter();
  const { role, status, user } = useAuth();
  const { openPreview } = useDocumentPreviewContext();
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isLoading] = useState(false);
  const [selectedTitipanId, setSelectedTitipanId] = useState<string | null>(
    null,
  );

  const debitur = getDebiturById(id as string);
  const historisKol = getHistorisKolektibilitasByDebiturId(id as string);
  const dokumen = getDokumenByDebiturId(id as string);
  const notaris = getNotarisByDebiturId(id as string);
  const actionPlan = getActionPlanByDebiturId(id as string);
  const hasilKunjungan = getHasilKunjunganByDebiturId(id as string);
  const langkahPenanganan = getLangkahPenangananByDebiturId(id as string);
  const suratPeringatan = getSuratPeringatanByDebiturId(id as string);
  const progressClaimAsuransi = debitur
    ? getKlaimAsuransiByNoKontrak(debitur.noKontrak)
    : [];
  const saldoDanaTitipan = debitur
    ? getSaldoDanaTitipanByNoKontrak(debitur.noKontrak)
    : 0;
  const historisTitipan = debitur
    ? getHistorisTitipanByNoKontrak(debitur.noKontrak)
    : [];
  const debiturNoKontrak = debitur?.noKontrak ?? "";
  const canViewLegalData =
    status === "authenticated" &&
    role !== null &&
    getDashboardRouteDecision(
      "/dashboard/legal/laporan",
      role,
      user?.role_id,
    ).allowed;
  const canViewDanaTitipan =
    status === "authenticated" &&
    role !== null &&
    getDashboardRouteDecision(
      "/dashboard/legal/titipan/asuransi",
      role,
      user?.role_id,
    ).allowed;
  const visibleTabs = useMemo(
    () =>
      ALL_TABS.filter((tab) => {
        if (tab.id === "titipan") return canViewDanaTitipan;
        if (
          tab.id === "bprs" ||
          tab.id === "notaris" ||
          tab.id === "sp" ||
          tab.id === "klaim"
        ) {
          return canViewLegalData;
        }
        return true;
      }),
    [canViewDanaTitipan, canViewLegalData],
  );
  const resolvedActiveTab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (visibleTabs[0]?.id ?? "info");
  const arsipDigitalTerkait =
    status !== "authenticated" || !role || !debiturNoKontrak
      ? []
      : filterDigitalDocuments(
          user?.is_restrict ?? false,
          dummyDokumen.filter((d) =>
            d.detail.toLowerCase().includes(debiturNoKontrak.toLowerCase()),
          ),
        ).sort((a, b) => a.namaDokumen.localeCompare(b.namaDokumen));

  const selectedTitipanDetail =
    historisTitipan.find((item) => item.id === selectedTitipanId) ??
    historisTitipan[0] ??
    null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!debitur) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <UserX
          className="w-16 h-16 mx-auto text-gray-300 mb-4"
          aria-hidden="true"
        />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Debitur tidak ditemukan
        </h2>
        <p className="text-gray-500 mb-4">
          Data dengan ID tersebut tidak ada dalam sistem.
        </p>
        <Link
          href="/dashboard/informasi-debitur"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Kembali ke List Debitur
        </Link>
      </div>
    );
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      Belum: "#6b7280",
      Pending: "#f59e0b",
      Proses: "#3b82f6",
      Selesai: "#10b981",
      "Belum Dikirim": "#6b7280",
      "Sudah Dikirim": "#3b82f6",
      Diterima: "#10b981",
    };
    const color = colors[status] || "#6b7280";
    return (
      <span
        className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {status}
      </span>
    );
  };

  const headerKolColor = getKolektibilitasColor(debitur.kolektibilitas);

  return (
    <div className="space-y-6">
      <FeatureHeader
        title={debitur.namaNasabah}
        subtitle={debitur.noKontrak}
        icon={<User />}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/informasi-debitur"
              className="btn btn-outline btn-sm"
              title="Kembali ke List Debitur"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Kembali
            </Link>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-900">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: headerKolColor }}
              />
              Kol {debitur.kolektibilitas} -{" "}
              {getKolektibilitasLabel(debitur.kolektibilitas)}
            </div>
          </div>
        }
      />

      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                resolvedActiveTab === tab.id
                  ? "border-[#157ec3] text-[#157ec3] bg-[#157ec3]/10"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {resolvedActiveTab === "info" && (
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  Informasi Nasabah
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <InfoRow label="No Kontrak" value={debitur.noKontrak} />
                  <InfoRow label="No Identitas" value={debitur.noIdentitas} />
                  <InfoRow label="Nama Nasabah" value={debitur.namaNasabah} />
                  <InfoRow label="Alamat" value={debitur.alamat} />
                  <InfoRow label="No Telepon" value={debitur.noTelp} />
                  <InfoRow label="Cabang" value={debitur.cabang} />
                  <InfoRow label="Marketing" value={debitur.marketing} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Wallet
                    className="w-4 h-4 text-blue-600"
                    aria-hidden="true"
                  />
                  Informasi Pembiayaan
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <InfoRow
                    label="Pokok"
                    value={formatCurrency(debitur.pokok)}
                  />
                  <InfoRow
                    label="Margin"
                    value={formatCurrency(debitur.margin)}
                  />
                  <InfoRow
                    label="Jangka Waktu"
                    value={`${debitur.jangkaWaktu} Bulan`}
                  />
                  <InfoRow
                    label="OS Pokok"
                    value={formatCurrency(debitur.osPokok)}
                  />
                  <InfoRow
                    label="OS Margin"
                    value={formatCurrency(debitur.osMargin)}
                  />
                  <InfoRow
                    label="Tanggal Akad"
                    value={formatInformasiDebiturDate(debitur.tanggalAkad)}
                  />
                  <InfoRow
                    label="Jatuh Tempo"
                    value={formatInformasiDebiturDate(
                      debitur.tanggalJatuhTempo,
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {resolvedActiveTab === "summary" && (
            <LaporanSummaryTimeline
              actionPlans={actionPlan}
              hasilKunjungans={hasilKunjungan}
              langkahPenanganans={langkahPenanganan}
            />
          )}

          {resolvedActiveTab === "bprs" && (
            <HasilIdebTab debiturId={debitur.id} />
          )}

          {resolvedActiveTab === "historis" && (
            <div>
              {historisKol.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Tidak ada data historis kolektibilitas</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="min-w-180 w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Bulan
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Kol
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          OS Pokok
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          OS Margin
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historisKol.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(
                              `/dashboard/informasi-debitur/${debitur.id}/fitur/historis/${item.id}`,
                            )
                          }
                        >
                          <td className="py-3 px-4 font-medium">
                            {item.bulan}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className="inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-bold bg-white border border-gray-200 text-gray-900"
                              style={{
                                borderColor: getKolektibilitasColor(
                                  item.kolektibilitas,
                                ),
                              }}
                            >
                              {item.kolektibilitas}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(item.osPokok)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(item.osMargin)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {item.keterangan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {resolvedActiveTab === "dokumen" && (
            <DokumenDebiturSection
              debiturId={debitur.id}
              initialDocuments={dokumen}
            />
          )}

          {resolvedActiveTab === "notaris" && (
            <div>
              {notaris.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Belum ada data notaris untuk debitur ini.</p>
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="min-w-180 w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            No
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Jenis Dokumen
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Nama Notaris
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Keterangan
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Dokumen
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {notaris.map((item, index) => (
                          <tr
                            key={item.id}
                            className="transition-colors hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {index + 1}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-700">
                              {item.jenisDokumen}
                            </td>
                            <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                              {item.namaNotaris}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {item.keterangan || "-"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {item.filePath ? (
                                <DebiturViewButton
                                  onClick={() => {
                                    if (!item.filePath) {
                                      return;
                                    }
                                    openPreview(
                                      normalizeDebiturDocumentUrl(item.filePath),
                                      `Dokumen ${item.jenisDokumen} - ${item.namaNotaris}`,
                                      item.fileType === "pdf" ? "pdf" : "image",
                                    );
                                  }}
                                  title="View dokumen notaris"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {resolvedActiveTab === "sp" && (
            <div>
              {suratPeringatan.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Belum ada surat peringatan</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="min-w-190 w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Jenis
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Tgl Terbit
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Tgl Kirim
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Keterangan
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Dokumen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {suratPeringatan.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(
                              `/dashboard/informasi-debitur/${debitur.id}/fitur/sp/${item.id}`,
                            )
                          }
                        >
                          <td className="py-3 px-4">
                            <span className="inline-flex px-2 py-1 rounded bg-blue-50 border border-blue-100 text-xs font-bold text-gray-900">
                              {item.jenisSurat}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatInformasiDebiturDate(item.tanggalTerbit)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatInformasiDebiturDate(item.tanggalKirim)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <StatusBadge status={item.statusKirim} />
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {item.keterangan || "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <DebiturViewButton
                              onClick={(e) => {
                                e.stopPropagation();
                                const suratDoc = arsipDigitalTerkait.find(
                                  (d) =>
                                    d.jenisDokumen === "Legal" &&
                                    d.namaDokumen.includes(item.jenisSurat),
                                );
                                const fileUrl =
                                  suratDoc?.fileUrl ??
                                  "/contoh-dok/surat-pernyataan-restrukturisasi.pdf";
                                openPreview(
                                  normalizeDebiturDocumentUrl(fileUrl),
                                  suratDoc
                                    ? `${suratDoc.namaDokumen} (${suratDoc.kode})`
                                    : `Surat Peringatan ${item.jenisSurat}`,
                                  "pdf",
                                );
                              }}
                              title={`View dokumen ${item.jenisSurat}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {resolvedActiveTab === "klaim" && (
            <div>
              {progressClaimAsuransi.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>Belum ada historis/progress claim asuransi.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <table className="min-w-220 w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Tanggal
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Jenis Claim
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Nilai Claim
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Nominal Pencairan
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Tanggal Pencairan
                        </th>
                        <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Lampiran
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {progressClaimAsuransi.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">
                            {formatInformasiDebiturDate(item.tanggalPengajuan)}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {item.jenisKlaim}
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-semibold">
                            {formatCurrency(item.nilaiKlaim)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right font-semibold">
                            {item.nilaiCair
                              ? formatCurrency(item.nilaiCair)
                              : "-"}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {formatInformasiDebiturDate(item.tanggalCair)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.lampiranFilePath ? (
                              <DebiturViewButton
                                onClick={() =>
                                  openPreview(
                                    normalizeDebiturDocumentUrl(
                                      item.lampiranFilePath!,
                                    ),
                                    item.lampiranFileName ||
                                      "tracking_claim_asuransi.pdf",
                                    "pdf",
                                  )
                                }
                                title="View lampiran"
                              />
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {resolvedActiveTab === "titipan" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">
                  <p className="text-sm text-blue-700 font-medium">
                    Saldo Dana Titipan
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatCurrency(saldoDanaTitipan)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <p className="text-sm text-emerald-700 font-medium">
                    Saldo Akhir Titipan Terpilih
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">
                    {selectedTitipanDetail
                      ? formatCurrency(selectedTitipanDetail.saldoAkhir)
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  List Dana Titipan
                </h3>
                {historisTitipan.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 border border-gray-100 rounded-lg">
                    Belum ada historis titipan.
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="min-w-220 w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Tanggal
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Jenis Titipan
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Nominal Titipan
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Saldo Akhir
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Keterangan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historisTitipan.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedTitipanId(item.id)}
                            className={`cursor-pointer transition-colors ${
                              selectedTitipanDetail?.id === item.id
                                ? "bg-blue-50/60"
                                : "hover:bg-gray-50"
                            }`}
                          >
                              <td className="py-3 px-4 text-sm">
                                {formatInformasiDebiturDate(item.tanggal)}
                              </td>
                            <td className="py-3 px-4 text-sm font-medium">
                              {item.jenisTitipan}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold">
                              {formatCurrency(item.nominalTitipan)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-emerald-700">
                              {formatCurrency(item.saldoAkhir)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {item.keterangan || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {selectedTitipanDetail && (
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">
                        Historis Transaksi Titipan Terpilih
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Klik baris pada list dana titipan untuk melihat detail
                        histori transaksi.
                      </p>
                    </div>
                    <div className="inline-flex px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">
                      {selectedTitipanDetail.jenisTitipan}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Nominal Titipan
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(selectedTitipanDetail.nominalTitipan)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        {selectedTitipanDetail.jenisTitipan === "Angsuran"
                          ? "Total Diproses"
                          : "Total Dibayar"}
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(selectedTitipanDetail.nominalTerbayar)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-700 mb-1">
                        Saldo Akhir
                      </p>
                      <p className="font-semibold text-emerald-900">
                        {formatCurrency(selectedTitipanDetail.saldoAkhir)}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className="min-w-200 w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Tanggal
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Aktivitas
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Nominal
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                            Keterangan
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...selectedTitipanDetail.riwayatTransaksi]
                          .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
                          .map((riwayat, idx) => (
                            <tr key={`${selectedTitipanDetail.id}-${idx}`}>
                              <td className="py-3 px-4 text-sm">
                                {formatInformasiDebiturDate(riwayat.tanggal)}
                              </td>
                              <td className="py-3 px-4 text-sm font-medium text-gray-800">
                                {riwayat.aksi}
                              </td>
                              <td className="py-3 px-4 text-sm text-right font-semibold">
                                {formatCurrency(riwayat.nominal)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {riwayat.keterangan?.trim()
                                  ? riwayat.keterangan
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
