"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  History,
  Send,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import FeatureHeader from "@/components/ui/FeatureHeader";
import DocumentViewButton from "@/components/manajemen-surat/DocumentViewButton";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import { useAuth } from "@/components/auth/AuthProvider";
import { filterDigitalDocuments } from "@/lib/rbac";
import { formatDateDisplay } from "@/lib/utils/date";
import { useArsipDigitalMasterData } from "@/components/arsip-digital/ArsipDigitalMasterDataProvider";
import { useArsipDigitalWorkflow } from "@/components/arsip-digital/ArsipDigitalWorkflowProvider";

const formatPersonName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

interface HistorisItem {
  id: number;
  kode: string;
  namaDokumen: string;
  detail: string;
  jenisDokumen: string;
  tglInput: string;
  userInput: string;
  tempatPenyimpanan: string;
  statusPinjam: string;
  alasanPengajuan: string;
  tglExpired: string | null;
  alasanAksi: string | null;
  pemilik?: string;
  pemohon?: string;
  tglPengajuan: string;
  status: string;
  tglAksi: string;
  fileUrl?: string;
  lemariId?: string;
  kantorId?: string;
}

export default function HistorisDisposisiPage() {
  const { role, user } = useAuth();
  const { tempatPenyimpanan } = useArsipDigitalMasterData();
  const { dokumen, disposisi } = useArsipDigitalWorkflow();
  const { openPreview } = useDocumentPreviewContext();
  const searchParams = useSearchParams();
  const filterLemariId = searchParams.get("lemariId");
  const filterKantorId = searchParams.get("kantorId");
  const [activeTab, setActiveTab] = useState<"permohonan" | "persetujuan">(
    "permohonan",
  );
  const [selectedItem, setSelectedItem] = useState<HistorisItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const accessibleDokumen = useMemo(() => {
    if (!role) return [];
    return filterDigitalDocuments(user?.is_restrict ?? false, dokumen);
  }, [dokumen, role, user?.is_restrict]);

  const accessibleById = useMemo(
    () => new Map(accessibleDokumen.map((item) => [item.id, item])),
    [accessibleDokumen],
  );

  const tempatById = useMemo(
    () => new Map(tempatPenyimpanan.map((item) => [item.id, item])),
    [tempatPenyimpanan],
  );

  const completedDisposisi = useMemo(
    () =>
      disposisi.filter(
        (item) =>
          (item.status === "Approved" || item.status === "Rejected") &&
          accessibleById.has(item.dokumenId),
      ),
    [accessibleById, disposisi],
  );

  const historisData = useMemo<HistorisItem[]>(() => {
    return completedDisposisi.map((item) => {
      const dokumenItem = accessibleById.get(item.dokumenId);
      const tempat = dokumenItem?.tempatPenyimpananId
        ? tempatById.get(dokumenItem.tempatPenyimpananId)
        : undefined;
      const lemariId = tempat
        ? `${tempat.kodeKantor}::${tempat.kodeLemari}`
        : undefined;
      const kantorId = tempat?.kodeKantor;
      const lokasi =
        dokumenItem?.tempatPenyimpanan ||
        tempat?.kodeLemari ||
        "-";
      const detail = item.detail || dokumenItem?.detail || "-";

      return {
        id: item.id,
        kode: dokumenItem?.kode ?? `DOK-${item.dokumenId}`,
        namaDokumen: dokumenItem?.namaDokumen ?? "-",
        jenisDokumen: dokumenItem?.jenisDokumen ?? "-",
        detail,
        tglInput: dokumenItem?.tglInput ?? "-",
        userInput: dokumenItem?.userInput ?? "-",
        tempatPenyimpanan: lokasi,
        statusPinjam: dokumenItem?.statusPinjam ?? "-",
        alasanPengajuan: item.alasanPengajuan,
        tglExpired: item.tglExpired,
        alasanAksi: item.alasanAksi,
        pemilik: item.pemilik,
        pemohon: item.pemohon,
        tglPengajuan: item.tglPengajuan,
        status: item.status,
        tglAksi: item.tglAksi || item.tglPengajuan,
        fileUrl: dokumenItem?.fileUrl,
        lemariId,
        kantorId,
      };
    });
  }, [
    accessibleById,
    completedDisposisi,
    tempatById,
  ]);

  const data = useMemo(() => {
    if (filterKantorId) {
      return historisData.filter((item) => item.kantorId === filterKantorId);
    }
    if (!filterLemariId) return historisData;
    return historisData.filter((item) => item.lemariId === filterLemariId);
  }, [filterKantorId, filterLemariId, historisData]);

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {filterLemariId || filterKantorId ? (
        <div className="mb-4">
          <Link
            href="/dashboard/arsip-digital/ruang-arsip/tempat-penyimpanan"
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Ruang Arsip Digital
          </Link>
        </div>
      ) : null}
      <FeatureHeader
        title="Historis Disposisi"
        subtitle="Arsip riwayat pengajuan dan persetujuan disposisi dokumen."
        icon={<History />}
      />

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setActiveTab("permohonan")}
          className={
            activeTab === "permohonan"
              ? "btn btn-primary"
              : "btn btn-outline !border-gray-400 !text-gray-800 !shadow-none hover:!border-gray-500 hover:!shadow-none"
          }
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          Permohonan Saya
        </button>
        <button
          onClick={() => setActiveTab("persetujuan")}
          className={
            activeTab === "persetujuan"
              ? "btn btn-primary"
              : "btn btn-outline !border-gray-400 !text-gray-800 !shadow-none hover:!border-gray-500 hover:!shadow-none"
          }
        >
          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          Persetujuan Saya
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Total Riwayat
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 leading-none">
              {data.length}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
            <History className="w-7 h-7" aria-hidden="true" />
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Disetujui
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 leading-none">
              {data.filter((d) => d.status === "Approved").length}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
          </div>
        </div>
        <div className="card p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Ditolak
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-2 leading-none">
              {data.filter((d) => d.status === "Rejected").length}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="w-7 h-7" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Dokumen
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {activeTab === "permohonan" ? "Pemilik" : "Pemohon"}
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tgl Pengajuan
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tgl Aksi
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, idx) => {
                const statusNormalized = item.status.toLowerCase();
                const isApproved =
                  statusNormalized === "approved" ||
                  statusNormalized === "disetujui";
                const showView = isApproved && Boolean(item.fileUrl);
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100 text-xs font-medium tabular-nums">
                        {item.kode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {item.namaDokumen}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-800">
                        {formatPersonName(
                          (activeTab === "permohonan"
                            ? item.pemilik
                            : item.pemohon) || "-",
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateDisplay(item.tglPengajuan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateDisplay(item.tglAksi)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${
                          isApproved
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {isApproved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Ditolak
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative ml-auto h-10 w-44">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetail(true);
                          }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Detail
                        </button>
                        {showView && (
                          <DocumentViewButton
                            onClick={() => {
                              openPreview(item.fileUrl!, item.namaDokumen);
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2"
                            title="View dokumen"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && selectedItem && (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Detail Disposisi
                </h2>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Kode Dokumen
                  </label>
                  <p className="font-bold text-primary-600 mt-1">
                    {selectedItem.kode}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Jenis Dokumen
                  </label>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedItem.jenisDokumen}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Nama Dokumen
                  </label>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedItem.namaDokumen}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Detail Dokumen
                  </label>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedItem.detail}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Pemohon
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {selectedItem.pemohon || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Pemilik Dokumen
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {selectedItem.pemilik || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Status Akhir
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${
                          selectedItem.status === "Approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    >
                      {selectedItem.status === "Approved"
                        ? "Disetujui"
                        : "Ditolak"}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Status Dokumen
                  </label>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700">
                      {selectedItem.statusPinjam}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Tanggal Pengajuan
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {formatDateDisplay(selectedItem.tglPengajuan)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Tanggal Aksi
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {formatDateDisplay(selectedItem.tglAksi)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Tanggal Input
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {formatDateDisplay(selectedItem.tglInput)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    User Input
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-800">
                      {selectedItem.userInput}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Tempat Penyimpanan
                  </label>
                  <p className="mt-1 inline-flex items-center rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-sm font-semibold text-gray-800">
                    {selectedItem.tempatPenyimpanan}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Akses Berlaku Sampai
                  </label>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedItem.tglExpired
                      ? formatDateDisplay(selectedItem.tglExpired)
                      : "-"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Alasan Pengajuan
                  </label>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedItem.alasanPengajuan}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                    Catatan Aksi
                  </label>
                  <p className="font-medium text-gray-800 mt-1">
                    {selectedItem.alasanAksi || "-"}
                  </p>
                </div>
              </div>

              {selectedItem.status === "Approved" && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Akses Diberikan
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Anda memiliki akses penuh ke dokumen ini sampai tanggal{" "}
                        <span className="font-bold">
                          {selectedItem.tglExpired
                            ? formatDateDisplay(selectedItem.tglExpired)
                            : "-"}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
