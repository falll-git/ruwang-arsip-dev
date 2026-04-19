"use client";

import { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import { dummyNasabahLegal, dummyHistoryCetak, NasabahLegal } from "@/lib/data";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import LegalViewButton from "@/components/legal/LegalViewButton";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { downloadFile } from "@/lib/utils/downloadFile";
import { formatDateDisplay, toIsoDate } from "@/lib/utils/date";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default function CetakSPPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNasabah, setSelectedNasabah] = useState<NasabahLegal | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [jenisSP, setJenisSP] = useState("SP-1");
  const [batasWaktu, setBatasWaktu] = useState("");
  const [catatan, setCatatan] = useState("");
  const [history, setHistory] = useState(dummyHistoryCetak);
  const [historySearch, setHistorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const nasabahBermasalah = useMemo(
    () =>
      dummyNasabahLegal.filter(
        (n) => n.kolektibilitas >= 2 && n.status === "Aktif",
      ),
    [],
  );
  const filteredNasabah = useMemo(() => {
    if (!searchQuery) return [];
    return nasabahBermasalah.filter(
      (n) =>
        n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.noKontrak.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, nasabahBermasalah]);

  const handleSelectNasabah = (nasabah: NasabahLegal) => {
    setSelectedNasabah(nasabah);
    setSearchQuery(nasabah.nama);
    setShowDropdown(false);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    setBatasWaktu(toIsoDate(deadline));
  };

  const handleGenerate = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }

    if (!batasWaktu) {
      showToast("Batas waktu belum diisi!", "warning");
      return;
    }

    downloadFile(
      "/documents/contoh-dok.pdf",
      `${jenisSP} - ${selectedNasabah.nama}.pdf`,
    );

    const now = new Date();
    const romanMonths = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    const noSurat = `SP/${String(history.length + 1).padStart(3, "0")}/${romanMonths[now.getMonth()]}/${now.getFullYear()}`;
    const newHistory = {
      id: history.length + 1,
      tanggal: toIsoDate(now),
      jenis: "SP",
      noSurat,
      noKontrak: selectedNasabah.noKontrak,
      namaNasabah: selectedNasabah.nama,
      detail: jenisSP,
      user: "SYSTEM",
    };
    setHistory([newHistory, ...history]);
    setCurrentPage(1);

    showToast(`${jenisSP} berhasil di-export (prototype)!`, "success");
  };

  const handlePreview = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }
    openPreview(
      "/documents/contoh-dok.pdf",
      `${jenisSP} - ${selectedNasabah.nama}`,
    );
  };

  const filteredHistory = useMemo(() => {
    let result = history.filter((h) => h.jenis === "SP");
    if (historySearch)
      result = result.filter(
        (h) =>
          h.namaNasabah.toLowerCase().includes(historySearch.toLowerCase()) ||
          h.noKontrak.toLowerCase().includes(historySearch.toLowerCase()),
      );
    return result;
  }, [historySearch, history]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportExcel = async () => {
    await exportToExcel({
      filename: "history_sp",
      sheetName: "History SP",
      title: "LAPORAN HISTORY SURAT PERINGATAN",
      columns: [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 12 },
        { header: "No Surat", key: "noSurat", width: 18 },
        { header: "No Kontrak", key: "noKontrak", width: 15 },
        { header: "Nama", key: "namaNasabah", width: 20 },
        { header: "Detail", key: "detail", width: 20 },
        { header: "User", key: "user", width: 12 },
      ],
      data: filteredHistory.map((item, idx) => ({ ...item, no: idx + 1 })),
    });
    showToast("Export Excel berhasil!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Cetak Surat Peringatan"
        subtitle="Generate SP-1, SP-2, SP-3 untuk nasabah bermasalah"
        icon={<AlertTriangle />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Cari Nasabah Bermasalah
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="No Kontrak / Nama..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                  if (!e.target.value) setSelectedNasabah(null);
                }}
                onFocus={() => setShowDropdown(true)}
                className="input input-with-icon"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedNasabah(null);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              {showDropdown && filteredNasabah.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredNasabah.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleSelectNasabah(n)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">
                          {n.nama}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                          Kol {n.kolektibilitas}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-800">
                          {n.noKontrak}
                        </span>{" "}
                        • Tunggakan:{" "}
                        {formatCurrency(n.tunggakanPokok + n.tunggakanMargin)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Menampilkan nasabah dengan Kolektibilitas ≥ 2
            </p>
          </div>

          {selectedNasabah && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Data Tunggakan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Nama</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.nama}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">No Kontrak</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.noKontrak}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Kolektibilitas</p>
                  <p className="font-bold text-gray-900 tabular-nums">
                    {selectedNasabah.kolektibilitas}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Total Tunggakan</p>
                  <p className="font-bold text-gray-900 tabular-nums">
                    {formatCurrency(
                      selectedNasabah.tunggakanPokok +
                        selectedNasabah.tunggakanMargin,
                    )}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Surat Peringatan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setJenisSP("SP-1")}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        jenisSP === "SP-1"
                          ? "bg-yellow-100 border-yellow-200"
                          : "bg-yellow-50 border-yellow-100 hover:bg-yellow-100"
                      }`}
                    >
                      <p className="font-bold text-yellow-800">SP-1</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Tunggakan 30-60 hari
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisSP("SP-2")}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        jenisSP === "SP-2"
                          ? "bg-orange-100 border-orange-200"
                          : "bg-orange-50 border-orange-100 hover:bg-orange-100"
                      }`}
                    >
                      <p className="font-semibold text-orange-800">SP-2</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Tunggakan 60-90 hari
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisSP("SP-3")}
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        jenisSP === "SP-3"
                          ? "bg-red-100 border-red-200"
                          : "bg-red-50 border-red-100 hover:bg-red-100"
                      }`}
                    >
                      <p className="font-semibold text-red-800">
                        SP-3 (Somasi)
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Tunggakan &gt;90 hari
                      </p>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batas Waktu Pembayaran
                  </label>
                  <DatePickerInput
                    value={batasWaktu}
                    onChange={setBatasWaktu}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={2}
                    className="textarea"
                    placeholder="Catatan..."
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="btn btn-primary flex-1"
                >
                  <Download className="w-5 h-5" />
                  Generate {jenisSP}
                </button>
                <LegalViewButton onClick={handlePreview} className="shrink-0" />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="font-semibold text-gray-800 mb-4">
              Panduan Surat Peringatan
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="font-bold text-yellow-800">SP-1</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Dikirim saat tunggakan 30-60 hari
                </p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="font-semibold text-orange-800">SP-2</p>
                <p className="text-orange-700 text-sm mt-1">
                  Dikirim saat tunggakan 60-90 hari
                </p>
              </div>
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="font-semibold text-red-800">SP-3 (Somasi)</p>
                <p className="text-red-700 text-sm mt-1">
                  Dikirim saat tunggakan &gt;90 hari
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex md:items-center justify-between gap-4 mb-6 flex-col md:flex-row">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            History Surat Peringatan
          </h2>
          <button
            onClick={handleExportExcel}
            className="btn btn-export-excel btn-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
        <div className="relative mb-4">
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Cari..."
            className="input input-with-icon"
          />
          <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  No Surat
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Jenis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedHistory.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateDisplay(item.tanggal)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-primary">
                    {item.noSurat}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.namaNasabah}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 border border-blue-100 text-blue-700">
                      {item.detail}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.user}</td>
                </tr>
              ))}
              {paginatedHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredHistory.length)}{" "}
              dari {filteredHistory.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm border ${currentPage === page ? "text-white border-transparent" : "border-gray-200 hover:bg-gray-100"}`}
                    style={
                      currentPage === page
                        ? {
                            background:
                              "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
                          }
                        : undefined
                    }
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
