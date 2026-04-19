"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  FileSpreadsheet,
  FileText,
  MapPin,
  Search,
  SearchX,
  X,
  Filter,
  User,
} from "lucide-react";
import {
  formatCurrency,
  getDebiturById,
  getKolektibilitasLabel,
} from "@/lib/data";
import { formatDateDisplay } from "@/lib/utils/date";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import FeatureHeader from "@/components/ui/FeatureHeader";
import DocumentViewButton from "@/components/manajemen-surat/DocumentViewButton";
import {
  RBAC_DENIED_MESSAGE,
  filterDigitalDocuments,
  type DataAccessLevel,
} from "@/lib/rbac";
import { useArsipDigitalMasterData } from "@/components/arsip-digital/ArsipDigitalMasterDataProvider";
import { useArsipDigitalWorkflow } from "@/components/arsip-digital/ArsipDigitalWorkflowProvider";

const formatPersonName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const PILL_BASE_CLASS =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";

function getDocumentStatusPillClass(status: string) {
  switch (status) {
    case "Tersedia":
      return `${PILL_BASE_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700`;
    case "Dipinjam":
      return `${PILL_BASE_CLASS} border-amber-200 bg-amber-50 text-amber-700`;
    case "Diajukan":
      return `${PILL_BASE_CLASS} border-blue-200 bg-blue-50 text-blue-700`;
    default:
      return `${PILL_BASE_CLASS} border-gray-200 bg-gray-100 text-gray-700`;
  }
}

type DokumenRow = {
  id: number;
  kode: string;
  jenisDokumen: string;
  namaDokumen: string;
  detail: string;
  tglInput: string;
  userInput: string;
  statusPinjam: string;
  tempatPenyimpananId: string | number | null;
  kodeKantor: string;
  namaKantor: string;
  kodeLemari: string;
  rak: string;
  noKontrak: string | null;
  debiturId: string | null;
  fileUrl: string | null;
  levelAkses: DataAccessLevel;
};

export default function ListDokumenPage() {
  const { role, user } = useAuth();
  const { showToast } = useAppToast();
  const { openPreview } = useDocumentPreviewContext();
  const { tempatPenyimpanan, jenisDokumen } = useArsipDigitalMasterData();
  const { dokumen, peminjaman } = useArsipDigitalWorkflow();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [selectedDoc, setSelectedDoc] = useState<DokumenRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const allDokumen = useMemo<DokumenRow[]>(() => {
    return dokumen.map((d) => {
      const tempat =
        d.tempatPenyimpananId != null
          ? tempatPenyimpanan.find((t) => t.id === d.tempatPenyimpananId)
          : undefined;

      return {
        id: d.id,
        kode: d.kode,
        jenisDokumen: d.jenisDokumen,
        namaDokumen: d.namaDokumen,
        detail: d.detail,
        tglInput: d.tglInput,
        userInput: d.userInput,
        statusPinjam: d.statusPinjam,
        tempatPenyimpananId: d.tempatPenyimpananId ?? null,
        kodeKantor: tempat?.kodeKantor ?? "-",
        namaKantor: tempat?.namaKantor ?? "-",
        kodeLemari: tempat?.kodeLemari ?? "-",
        rak: tempat?.rak ?? "-",
        noKontrak: d.noKontrak ?? null,
        debiturId: d.debiturId ?? null,
        fileUrl: d.fileUrl ?? null,
        levelAkses: d.levelAkses,
      };
    });
  }, [dokumen, tempatPenyimpanan]);

  const jenisDokumenList = useMemo(() => {
    return [
      "Semua",
      ...jenisDokumen.filter((j) => j.status === "Aktif").map((j) => j.nama),
    ];
  }, [jenisDokumen]);

  const accessibleDokumen = useMemo(() => {
    if (!role) return [] as typeof allDokumen;
    return filterDigitalDocuments(user?.is_restrict ?? false, allDokumen);
  }, [allDokumen, role, user?.is_restrict]);

  const historisPeminjaman = useMemo(() => {
    if (!selectedDoc) return [];
    return peminjaman
      .filter((p) => p.dokumenId === selectedDoc.id)
      .map((p) => ({
        id: p.id,
        peminjam: p.peminjam,
        tglPinjam: p.tglPinjam,
        tglKembali: p.tglKembali,
        status: p.status,
      }));
  }, [peminjaman, selectedDoc]);

  const debiturTerkait = useMemo(() => {
    if (!selectedDoc?.debiturId) return undefined;
    return getDebiturById(selectedDoc.debiturId);
  }, [selectedDoc]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const kode = new URLSearchParams(window.location.search).get("kode");
    if (!kode) return;

    const timer = setTimeout(() => {
      setSearchTerm(kode);
      const doc = accessibleDokumen.find(
        (d) => d.kode.toLowerCase() === kode.toLowerCase(),
      );
      if (doc) {
        setSelectedDoc(doc);
        setShowDetail(true);
      } else {
        showToast(RBAC_DENIED_MESSAGE, "warning");
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [accessibleDokumen, showToast]);

  const filteredDokumen = accessibleDokumen.filter((doc) => {
    const matchSearch =
      doc.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.kode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchJenis =
      filterJenis === "Semua" || doc.jenisDokumen === filterJenis;
    return matchSearch && matchJenis;
  });

  const handleRowClick = (doc: (typeof allDokumen)[0]) => {
    setSelectedDoc(doc);
    setShowDetail(true);
  };

  const handleExport = async () => {
    await exportToExcel({
      filename: "list-dokumen-digital",
      sheetName: "List Dokumen",
      title: "Daftar Dokumen Digital",
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Kode", key: "kode", width: 15 },
        { header: "Jenis Dokumen", key: "jenisDokumen", width: 20 },
        { header: "Nama Dokumen", key: "namaDokumen", width: 30 },
        { header: "Detail", key: "detail", width: 40 },
        { header: "Tgl Input", key: "tglInput", width: 15 },
        { header: "User Input", key: "userInput", width: 15 },
        { header: "Status", key: "statusPinjam", width: 12 },
      ],
      data: filteredDokumen.map((doc, idx) => ({
        no: idx + 1,
        kode: doc.kode,
        jenisDokumen: doc.jenisDokumen,
        namaDokumen: doc.namaDokumen,
        detail: doc.detail,
        tglInput: formatDateDisplay(doc.tglInput),
        userInput: doc.userInput,
        statusPinjam: doc.statusPinjam,
      })),
    });
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <FeatureHeader
        title="List Dokumen Digital"
        subtitle="Daftar seluruh dokumen yang tersimpan dalam sistem."
        icon={<FileText />}
        actions={
          <button
            onClick={handleExport}
            className="btn btn-export-excel"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>Export Excel</span>
          </button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-5">
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex-1 relative">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Cari Dokumen
            </label>
            <div className="relative">
              <Search
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, kode, atau keterangan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-with-icon"
              />
            </div>
          </div>

          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Filter Jenis Dokumen
            </label>
            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value)}
                className="select input-with-icon"
              >
                {jenisDokumenList.map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">
            Menampilkan{" "}
            <span className="font-bold text-gray-900">
              {filteredDokumen.length}
            </span>{" "}
            data
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                  Kode
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                  Jenis
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Dokumen
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                  Detail
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                  Input
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                  User
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDokumen.length > 0 ? (
                filteredDokumen.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    onDoubleClick={() => handleRowClick(doc)}
                    className="group hover:bg-blue-50/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100 text-xs font-medium tabular-nums">
                        {doc.kode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {doc.jenisDokumen}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold group-hover:text-primary-700 transition-colors">
                      {doc.namaDokumen}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                      {doc.detail}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateDisplay(doc.tglInput)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                      {formatPersonName(doc.userInput)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className={getDocumentStatusPillClass(doc.statusPinjam)}>
                        {doc.statusPinjam}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <SearchX className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-900">
                        Tidak ada dokumen ditemukan
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Coba sesuaikan filter atau kata kunci pencarian Anda
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetail && selectedDoc && (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/10"
                  style={{
                    background:
                      "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
                  }}
                >
                  <FileText className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Detail Dokumen
                  </h2>
                  <p className="text-sm text-gray-500">{selectedDoc.kode}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Kode Dokumen
                    </label>
                    <p className="text-lg font-bold text-primary-600 mt-1">
                      {selectedDoc.kode}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Jenis Dokumen
                    </label>
                    <p className="text-base font-medium text-gray-800 mt-1">
                      {selectedDoc.jenisDokumen}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Nama Dokumen
                    </label>
                    <p className="text-base font-medium text-gray-800 mt-1">
                      {selectedDoc.namaDokumen}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Detail
                    </label>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {selectedDoc.detail}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Tanggal Input
                      </label>
                      <p className="text-base font-medium text-gray-800 mt-1">
                        {formatDateDisplay(selectedDoc.tglInput)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        User Input
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {selectedDoc.userInput.substring(0, 1)}
                        </div>
                        <p className="text-base font-medium text-gray-800">
                          {formatPersonName(selectedDoc.userInput)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Status
                    </label>
                    <div className="mt-2">
                      <span
                        className={getDocumentStatusPillClass(
                          selectedDoc.statusPinjam,
                        )}
                      >
                        {selectedDoc.statusPinjam}
                      </span>
                    </div>
                  </div>

                  {selectedDoc.fileUrl ? (
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                        Action
                      </label>
                      <DocumentViewButton
                        onClick={() => {
                          openPreview(
                            selectedDoc.fileUrl!,
                            selectedDoc.namaDokumen,
                          );
                        }}
                        className="w-full justify-center"
                        title="View dokumen"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  Lokasi Penyimpanan
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-500 block mb-1">
                      Kantor
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedDoc.namaKantor}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-500 block mb-1">
                      Kode
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedDoc.kodeKantor}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-500 block mb-1">
                      Lemari
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedDoc.kodeLemari}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <span className="text-xs text-gray-500 block mb-1">
                      Rak
                    </span>
                    <span className="font-semibold text-gray-800">
                      {selectedDoc.rak}
                    </span>
                  </div>
                </div>
              </div>

              {(selectedDoc.noKontrak || selectedDoc.debiturId) && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User
                      className="w-5 h-5 text-gray-400"
                      aria-hidden="true"
                    />
                    Informasi Nasabah
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block mb-1">
                        No Kontrak
                      </span>
                      <span className="font-semibold text-gray-800">
                        {selectedDoc.noKontrak ??
                          debiturTerkait?.noKontrak ??
                          "-"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block mb-1">
                        Nama Nasabah
                      </span>
                      <span className="font-semibold text-gray-800">
                        {debiturTerkait?.namaNasabah ?? "-"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block mb-1">
                        Kolektibilitas
                      </span>
                      <span className="font-semibold text-gray-800">
                        {debiturTerkait
                          ? getKolektibilitasLabel(
                              debiturTerkait.kolektibilitas,
                            )
                          : "-"}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs text-gray-500 block mb-1">
                        OS Pokok / OS Margin
                      </span>
                      <span className="font-semibold text-gray-800">
                        {debiturTerkait
                          ? `${formatCurrency(debiturTerkait.osPokok)} / ${formatCurrency(debiturTerkait.osMargin)}`
                          : "-"}
                      </span>
                    </div>
                  </div>

                  {debiturTerkait && (
                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/dashboard/informasi-debitur/${debiturTerkait.id}`}
                        className="btn btn-outline btn-sm"
                      >
                        Lihat Detail Debitur
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {historisPeminjaman.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-400" />
                    Riwayat Peminjaman
                  </h3>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Peminjam
                          </th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Pinjam
                          </th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Kembali
                          </th>
                          <th className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {historisPeminjaman.map((h, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">{h.peminjam}</td>
                            <td className="px-4 py-2 text-sm">
                              {formatDateDisplay(h.tglPinjam)}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {formatDateDisplay(h.tglKembali)}
                            </td>
                            <td className="px-4 py-2">
                              <span className="badge badge-success text-xs">
                                {h.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
