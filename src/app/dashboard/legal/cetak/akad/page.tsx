"use client";

import { useState, useMemo } from "react";
import {
  Search,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  dummyNasabahLegal,
  dummyHistoryCetak,
  jenisAkadOptions,
  NasabahLegal,
} from "@/lib/data";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import LegalViewButton from "@/components/legal/LegalViewButton";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { downloadFile } from "@/lib/utils/downloadFile";
import {
  formatDateDisplay,
  parseDateString,
  toIsoDate,
} from "@/lib/utils/date";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function CetakAkadPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNasabah, setSelectedNasabah] = useState<NasabahLegal | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);

  const [jenisAkad, setJenisAkad] = useState("Murabahah");
  const [plafond, setPlafond] = useState("");
  const [margin, setMargin] = useState("");
  const [jangkaWaktu, setJangkaWaktu] = useState("");
  const [tanggalAkad, setTanggalAkad] = useState("");
  const [objekPembiayaan, setObjekPembiayaan] = useState("");
  const [agunan, setAgunan] = useState("");
  const [catatan, setCatatan] = useState("");

  const [history, setHistory] = useState(dummyHistoryCetak);
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredNasabah = useMemo(() => {
    if (!searchQuery) return [];
    return dummyNasabahLegal.filter(
      (n) =>
        n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.noKontrak.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.nik.includes(searchQuery),
    );
  }, [searchQuery]);

  const handleSelectNasabah = (nasabah: NasabahLegal) => {
    setSelectedNasabah(nasabah);
    setSearchQuery(nasabah.nama);
    setShowDropdown(false);
    setJenisAkad(nasabah.jenisAkad);
    setPlafond(nasabah.plafond.toString());
    setMargin(nasabah.margin.toString());
    setJangkaWaktu(nasabah.jangkaWaktu.toString());
    setTanggalAkad(nasabah.tanggalAkad);
    setObjekPembiayaan(nasabah.objekPembiayaan);
    setAgunan(nasabah.agunan);
  };

  const handleGenerate = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }

    if (!tanggalAkad) {
      showToast("Tanggal akad belum diisi!", "warning");
      return;
    }

    downloadFile(
      "/documents/contoh-dok.pdf",
      `Akad ${jenisAkad} - ${selectedNasabah.nama}.pdf`,
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
    const noSurat = `AKD/${String(history.length + 1).padStart(3, "0")}/${romanMonths[now.getMonth()]}/${now.getFullYear()}`;
    const newHistory = {
      id: history.length + 1,
      tanggal: toIsoDate(now),
      jenis: "Akad",
      noSurat,
      noKontrak: selectedNasabah.noKontrak,
      namaNasabah: selectedNasabah.nama,
      detail: `${jenisAkad} - ${selectedNasabah.produk}`,
      user: "SYSTEM",
    };
    setHistory([newHistory, ...history]);
    setCurrentPage(1);

    showToast("Dokumen akad berhasil di-export (prototype)!", "success");
  };

  const handlePreview = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }
    openPreview(
      "/documents/contoh-dok.pdf",
      `Akad ${jenisAkad} - ${selectedNasabah.nama}`,
    );
  };

  const filteredHistory = useMemo(() => {
    let result = history.filter((h) => h.jenis === "Akad");
    if (filterJenis !== "Semua") {
      result = result.filter((h) => h.detail.includes(filterJenis));
    }
    if (filterTanggal) {
      result = result.filter((h) => {
        const parsed = parseDateString(h.tanggal);
        return parsed ? toIsoDate(parsed) === filterTanggal : false;
      });
    }
    if (historySearch) {
      result = result.filter(
        (h) =>
          h.namaNasabah.toLowerCase().includes(historySearch.toLowerCase()) ||
          h.noKontrak.toLowerCase().includes(historySearch.toLowerCase()),
      );
    }
    return result;
  }, [filterJenis, filterTanggal, historySearch, history]);

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleExportExcel = async () => {
    await exportToExcel({
      filename: "history_cetak_akad",
      sheetName: "History Cetak Akad",
      title: "LAPORAN HISTORY CETAK DOKUMEN AKAD",
      columns: [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 12 },
        { header: "No Akad", key: "noSurat", width: 18 },
        { header: "No Kontrak", key: "noKontrak", width: 15 },
        { header: "Nama Nasabah", key: "namaNasabah", width: 20 },
        { header: "Jenis Akad", key: "detail", width: 25 },
        { header: "User", key: "user", width: 12 },
      ],
      data: filteredHistory.map((item, idx) => ({ ...item, no: idx + 1 })),
    });
    showToast("Export Excel berhasil!", "success");
  };

  const handleExportPDF = () => {
    downloadFile("/documents/contoh-dok.pdf", "Laporan History Cetak Akad.pdf");
    showToast("Export PDF berhasil (prototype)!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Cetak Dokumen Akad"
        subtitle="Generate dokumen akad pembiayaan nasabah"
        icon={<FileText />}
      />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Cari Nasabah
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Masukkan No Kontrak / Nama / NIK..."
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {showDropdown && filteredNasabah.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredNasabah.map((nasabah) => (
                    <button
                      key={nasabah.id}
                      onClick={() => handleSelectNasabah(nasabah)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="font-medium text-gray-800">
                        {nasabah.nama}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-800">
                          {nasabah.noKontrak}
                        </span>{" "}
                        • {nasabah.nik}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedNasabah && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Data Nasabah
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">No Kontrak:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.noKontrak}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Nama:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.nama}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">NIK:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.nik}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Alamat:</span>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.alamat}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Detail Akad
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jenis Akad <span className="text-red-500">*</span>
                </label>
                <select
                  value={jenisAkad}
                  onChange={(e) => setJenisAkad(e.target.value)}
                  className="select"
                >
                  {jenisAkadOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Plafond <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={
                    plafond ? formatCurrency(Number.parseInt(plafond, 10)) : ""
                  }
                  onChange={(e) =>
                    setPlafond(e.target.value.replace(/\D/g, ""))
                  }
                  className="input"
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Margin <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={
                    margin ? formatCurrency(Number.parseInt(margin, 10)) : ""
                  }
                  onChange={(e) => setMargin(e.target.value.replace(/\D/g, ""))}
                  className="input"
                  placeholder="Rp 0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Jangka Waktu (bulan) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={jangkaWaktu}
                  onChange={(e) => setJangkaWaktu(e.target.value)}
                  className="input"
                  placeholder="24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Akad <span className="text-red-500">*</span>
                </label>
                <DatePickerInput
                  value={tanggalAkad}
                  onChange={setTanggalAkad}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Objek Pembiayaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={objekPembiayaan}
                  onChange={(e) => setObjekPembiayaan(e.target.value)}
                  className="input"
                  placeholder="Modal Usaha, Kendaraan, dll"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Agunan
                </label>
                <textarea
                  value={agunan}
                  onChange={(e) => setAgunan(e.target.value)}
                  rows={2}
                  className="textarea"
                  placeholder="Detail agunan..."
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
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleGenerate}
                className="btn btn-primary flex-1"
              >
                <Download className="w-5 h-5" />
                Generate & Download
              </button>
              <LegalViewButton onClick={handlePreview} className="shrink-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            History Cetak Dokumen Akad
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportExcel}
              className="btn btn-export-excel btn-sm"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="btn btn-export-pdf btn-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative">
            <DatePickerInput
              value={filterTanggal}
              onChange={setFilterTanggal}
              placeholder="Filter tanggal"
            />
          </div>
          <div className="relative">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="select"
            >
              <option value="Semua">Semua Jenis</option>
              {jenisAkadOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="relative flex-1 min-w-50">
            <input
              type="text"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Cari nama/kontrak..."
              className="input input-with-icon"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
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
                  No Akad
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nama Nasabah
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Jenis Akad
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
                  <td className="px-4 py-3 text-sm">{item.detail}</td>
                  <td className="px-4 py-3 text-sm">{item.user}</td>
                </tr>
              ))}
              {paginatedHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data history
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredHistory.length)}{" "}
              dari {filteredHistory.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm border ${
                      currentPage === page
                        ? "text-white border-transparent"
                        : "border-gray-200 hover:bg-gray-100"
                    }`}
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
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
