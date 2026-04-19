"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, UserX } from "lucide-react";
import {
  dummyDokumen,
  formatCurrency,
  getActionPlanByDebiturId,
  getDebiturById,
  getHistorisKolektibilitasByDebiturId,
  getKolektibilitasColor,
  getKolektibilitasLabel,
  getLangkahPenangananByDebiturId,
  getHasilKunjunganByDebiturId,
  getSuratPeringatanByDebiturId,
} from "@/lib/data";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import DebiturViewButton from "@/components/debitur/DebiturViewButton";
import KolBadge from "@/components/marketing/KolBadge";
import {
  RBAC_DENIED_MESSAGE,
  filterDigitalDocuments,
  getDashboardRouteDecision,
} from "@/lib/rbac";
import {
  formatInformasiDebiturDate,
  normalizeDebiturDocumentUrl,
} from "@/lib/utils/informasi-debitur";

type FeatureType =
  | "historis"
  | "actionplan"
  | "kunjungan"
  | "penanganan"
  | "sp";

const featureLabels: Record<FeatureType, string> = {
  historis: "Historis Kolektibilitas",
  actionplan: "Action Plan",
  kunjungan: "Hasil Kunjungan",
  penanganan: "Langkah Penanganan",
  sp: "Surat Peringatan",
};

const isFeatureType = (value: string): value is FeatureType =>
  Object.keys(featureLabels).includes(value);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="py-3 border-b border-gray-100 last:border-0">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <div className="text-sm text-gray-900 font-medium">{value}</div>
  </div>
);

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

export default function DetailFiturDebiturPage() {
  const router = useRouter();
  const params = useParams<{
    id: string;
    feature: string;
    itemId: string;
  }>();
  const { role, status, user } = useAuth();
  const { showToast } = useAppToast();
  const { openPreview } = useDocumentPreviewContext();

  const debiturId = params.id;
  const feature = params.feature;
  const itemId = params.itemId;

  const debitur = getDebiturById(debiturId);
  const debiturNoKontrak = debitur?.noKontrak ?? "";
  const featureAccessDecision = useMemo(() => {
    if (!isFeatureType(feature)) {
      return { allowed: false, reason: "UNKNOWN_ROUTE_DENIED" as const };
    }

    switch (feature) {
      case "actionplan":
        return getDashboardRouteDecision(
          "/dashboard/informasi-debitur/marketing/action-plan",
          role,
          user?.role_id,
        );
      case "kunjungan":
        return getDashboardRouteDecision(
          "/dashboard/informasi-debitur/marketing/hasil-kunjungan",
          role,
          user?.role_id,
        );
      case "penanganan":
        return getDashboardRouteDecision(
          "/dashboard/informasi-debitur/marketing/langkah-penanganan",
          role,
          user?.role_id,
        );
      case "sp":
        return getDashboardRouteDecision(
          "/dashboard/legal/laporan",
          role,
          user?.role_id,
        );
      case "historis":
      default:
        return { allowed: true, reason: "ALLOWED" as const };
    }
  }, [feature, role, user?.role_id]);
  const arsipDigitalTerkait =
    status !== "authenticated" || !role || !debiturNoKontrak
      ? []
      : filterDigitalDocuments(
          user?.is_restrict ?? false,
          dummyDokumen.filter((doc) =>
            doc.detail.toLowerCase().includes(debiturNoKontrak.toLowerCase()),
          ),
        );

  useEffect(() => {
    if (status !== "authenticated" || !debitur || !isFeatureType(feature)) return;
    if (featureAccessDecision.allowed) return;

    showToast(RBAC_DENIED_MESSAGE, "warning");
    router.replace(`/dashboard/informasi-debitur/${debiturId}`);
  }, [
    debitur,
    debiturId,
    feature,
    featureAccessDecision.allowed,
    router,
    showToast,
    status,
  ]);

  const normalizeFileUrl = (filePath: string) => {
    if (/^https?:\/\//i.test(filePath)) return filePath;
    if (/^(blob:|data:)/i.test(filePath)) return filePath;
    if (filePath.startsWith("/")) {
      return filePath.startsWith("/documents/")
        ? filePath
        : `/documents${filePath}`;
    }
    return filePath.startsWith("documents/")
      ? `/${filePath}`
      : `/documents/${filePath}`;
  };

  if (!debitur || !isFeatureType(feature)) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <UserX className="w-14 h-14 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Detail fitur tidak ditemukan
        </h2>
        <Link
          href="/dashboard/informasi-debitur"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke List Debitur
        </Link>
      </div>
    );
  }

  const historisItem = getHistorisKolektibilitasByDebiturId(debiturId).find(
    (item) => item.id === itemId,
  );
  const actionPlanItem = getActionPlanByDebiturId(debiturId).find(
    (item) => item.id === itemId,
  );
  const kunjunganItem = getHasilKunjunganByDebiturId(debiturId).find(
    (item) => item.id === itemId,
  );
  const penangananItem = getLangkahPenangananByDebiturId(debiturId).find(
    (item) => item.id === itemId,
  );
  const spItem = getSuratPeringatanByDebiturId(debiturId).find(
    (item) => item.id === itemId,
  );

  const selectedItem =
    feature === "historis"
      ? historisItem
      : feature === "actionplan"
        ? actionPlanItem
        : feature === "kunjungan"
          ? kunjunganItem
          : feature === "penanganan"
            ? penangananItem
            : spItem;

  if (!selectedItem) {
    return (
      <div className="bg-white rounded-xl p-12 text-center">
        <FileText className="w-14 h-14 mx-auto text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Data detail tidak ditemukan
        </h2>
        <p className="text-gray-500 mb-4">
          Item detail yang dipilih tidak tersedia untuk debitur ini.
        </p>
        <Link
          href={`/dashboard/informasi-debitur/${debitur.id}`}
          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Detail Debitur
        </Link>
      </div>
    );
  }

  const headerKolColor = getKolektibilitasColor(debitur.kolektibilitas);

  if (status !== "authenticated" || !featureAccessDecision.allowed) {
    return null;
  }

  return (
    <div className="space-y-6">
      <FeatureHeader
        title={`Detail ${featureLabels[feature]}`}
        subtitle={`${debitur.namaNasabah} - ${debitur.noKontrak}`}
        icon={<FileText />}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/informasi-debitur/${debitur.id}`}
              className="btn btn-outline btn-sm"
              title="Kembali ke Detail Debitur"
            >
              <ArrowLeft className="w-4 h-4" />
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
        className="bg-white rounded-xl p-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        {feature === "historis" && historisItem && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <DetailRow label="Bulan" value={historisItem.bulan} />
              <DetailRow
                label="Kolektibilitas"
                value={<KolBadge kol={historisItem.kolektibilitas} />}
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <DetailRow
                label="OS Pokok"
                value={formatCurrency(historisItem.osPokok)}
              />
              <DetailRow
                label="OS Margin"
                value={formatCurrency(historisItem.osMargin)}
              />
              <DetailRow label="Keterangan" value={historisItem.keterangan} />
            </div>
          </div>
        )}

        {feature === "actionplan" && actionPlanItem && (
          <div className="bg-gray-50 rounded-lg p-4">
            <DetailRow
              label="Tanggal Input"
              value={formatInformasiDebiturDate(actionPlanItem.tanggal)}
            />
            <DetailRow label="Rencana" value={actionPlanItem.rencana} />
            <DetailRow
              label="Target Tanggal"
              value={formatInformasiDebiturDate(actionPlanItem.targetTanggal)}
            />
            <DetailRow
              label="Status"
              value={<StatusBadge status={actionPlanItem.status} />}
            />
            <DetailRow
              label="Lampiran"
              value={
                actionPlanItem.lampiranFilePath ? (
                  <DebiturViewButton
                    onClick={() =>
                      openPreview(
                        normalizeFileUrl(actionPlanItem.lampiranFilePath!),
                        actionPlanItem.lampiranFileName ||
                          "lampiran_action_plan.pdf",
                        "pdf",
                      )
                    }
                    title="View lampiran"
                  />
                ) : (
                  "-"
                )
              }
            />
          </div>
        )}

        {feature === "kunjungan" && kunjunganItem && (
          <div className="bg-gray-50 rounded-lg p-4">
            <DetailRow
              label="Tanggal Kunjungan"
              value={formatInformasiDebiturDate(kunjunganItem.tanggalKunjungan)}
            />
            <DetailRow label="Alamat" value={kunjunganItem.alamat || "-"} />
            <DetailRow
              label="Hasil Kunjungan"
              value={kunjunganItem.hasilKunjungan}
            />
            <DetailRow label="Kesimpulan" value={kunjunganItem.kesimpulan} />
            <DetailRow
              label="Lampiran"
              value={
                kunjunganItem.fotoKunjungan ? (
                  <DebiturViewButton
                    onClick={() =>
                      openPreview(
                        normalizeFileUrl(kunjunganItem.fotoKunjungan!),
                        kunjunganItem.fotoKunjunganNama ||
                          `Lampiran Kunjungan - ${debitur.namaNasabah}`,
                        kunjunganItem.fotoKunjunganTipe ??
                          (kunjunganItem
                            .fotoKunjungan!.toLowerCase()
                            .endsWith(".pdf")
                            ? "pdf"
                            : "image"),
                      )
                    }
                    title="View lampiran"
                  />
                ) : (
                  "-"
                )
              }
            />
          </div>
        )}

        {feature === "penanganan" && penangananItem && (
          <div className="bg-gray-50 rounded-lg p-4">
            <DetailRow
              label="Tanggal Input"
              value={formatInformasiDebiturDate(penangananItem.tanggal)}
            />
            <DetailRow label="Langkah" value={penangananItem.langkah} />
            <DetailRow
              label="Hasil Penanganan"
              value={penangananItem.hasilPenanganan}
            />
            <DetailRow
              label="Status"
              value={<StatusBadge status={penangananItem.status} />}
            />
            <DetailRow
              label="Lampiran"
              value={
                penangananItem.lampiranFilePath ? (
                  <DebiturViewButton
                    onClick={() =>
                      openPreview(
                        normalizeFileUrl(penangananItem.lampiranFilePath!),
                        penangananItem.lampiranFileName ||
                          "lampiran_langkah_penanganan.pdf",
                        "pdf",
                      )
                    }
                    title="View lampiran"
                  />
                ) : (
                  "-"
                )
              }
            />
          </div>
        )}

        {feature === "sp" && spItem && (
          <div className="bg-gray-50 rounded-lg p-4">
            <DetailRow label="Jenis Surat" value={spItem.jenisSurat} />
            <DetailRow
              label="Tanggal Terbit"
              value={formatInformasiDebiturDate(spItem.tanggalTerbit)}
            />
            <DetailRow
              label="Tanggal Kirim"
              value={formatInformasiDebiturDate(spItem.tanggalKirim)}
            />
            <DetailRow
              label="Status Kirim"
              value={<StatusBadge status={spItem.statusKirim} />}
            />
            <DetailRow label="Keterangan" value={spItem.keterangan || "-"} />
            <DetailRow
              label="Dokumen"
              value={
                <DebiturViewButton
                  onClick={() => {
                    const suratDoc = arsipDigitalTerkait.find(
                      (doc) =>
                        doc.jenisDokumen === "Legal" &&
                        doc.namaDokumen.includes(spItem.jenisSurat),
                    );
                    const fileUrl =
                      suratDoc?.fileUrl ??
                      "/contoh-dok/surat-pernyataan-restrukturisasi.pdf";
                    openPreview(
                      normalizeDebiturDocumentUrl(fileUrl),
                      suratDoc
                        ? `${suratDoc.namaDokumen} (${suratDoc.kode})`
                      : `Surat Peringatan ${spItem.jenisSurat}`,
                      "pdf",
                    );
                  }}
                  title="View dokumen"
                />
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
