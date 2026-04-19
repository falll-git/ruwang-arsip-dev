"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Car,
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

export default function CetakSamsatPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNasabah, setSelectedNasabah] = useState<NasabahLegal | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [jenisSurat, setJenisSurat] = useState("Surat Pengantar Pajak");
  const [masaBerlaku, setMasaBerlaku] = useState("");
  const [catatan, setCatatan] = useState("");
  const [history, setHistory] = useState(dummyHistoryCetak);
  const [historySearch, setHistorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const nasabahKendaraan = useMemo(
    () => dummyNasabahLegal.filter((n) => n.kendaraan),
    [],
  );
  const filteredNasabah = useMemo(() => {
    if (!searchQuery) return [];
    return nasabahKendaraan.filter(
      (n) =>
        n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.noKontrak.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.kendaraan?.noPolisi.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, nasabahKendaraan]);

  const handleSelectNasabah = (nasabah: NasabahLegal) => {
    setSelectedNasabah(nasabah);
    setSearchQuery(nasabah.nama);
    setShowDropdown(false);
    const validity = new Date();
    validity.setMonth(validity.getMonth() + 1);
    setMasaBerlaku(toIsoDate(validity));
  };

  const handleGenerate = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }

    if (!selectedNasabah.kendaraan) {
      showToast("Data kendaraan belum tersedia untuk nasabah ini!", "error");
      return;
    }

    if (!masaBerlaku) {
      showToast("Masa berlaku belum diisi!", "warning");
      return;
    }

    downloadFile(
      "/documents/contoh-dok.pdf",
      `SAMSAT - ${selectedNasabah.nama}.pdf`,
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
    const noSurat = `SAM/${String(history.length + 1).padStart(3, "0")}/${romanMonths[now.getMonth()]}/${now.getFullYear()}`;
    const newHistory = {
      id: history.length + 1,
      tanggal: toIsoDate(now),
      jenis: "SAMSAT",
      noSurat,
      noKontrak: selectedNasabah.noKontrak,
      namaNasabah: selectedNasabah.nama,
      detail: jenisSurat,
      user: "SYSTEM",
    };
    setHistory([newHistory, ...history]);
    setCurrentPage(1);

    showToast(`${jenisSurat} berhasil di-export (prototype)!`, "success");
  };

  const handlePreview = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }
    openPreview(
      "/documents/contoh-dok.pdf",
      `SAMSAT - ${selectedNasabah.nama}`,
    );
  };

  const filteredHistory = useMemo(() => {
    let result = history.filter((h) => h.jenis === "SAMSAT");
    if (historySearch)
      result = result.filter((h) =>
        h.namaNasabah.toLowerCase().includes(historySearch.toLowerCase()),
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
      filename: "history_samsat",
      sheetName: "History SAMSAT",
      title: "LAPORAN HISTORY SURAT SAMSAT",
      columns: [
        { header: "No", key: "no", width: 5 },
        { header: "Tanggal", key: "tanggal", width: 12 },
        { header: "No Surat", key: "noSurat", width: 18 },
        { header: "No Kontrak", key: "noKontrak", width: 15 },
        { header: "Nama", key: "namaNasabah", width: 20 },
        { header: "Detail", key: "detail", width: 25 },
        { header: "User", key: "user", width: 12 },
      ],
      data: filteredHistory.map((item, idx) => ({ ...item, no: idx + 1 })),
    });
    showToast("Export Excel berhasil!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Cetak Surat SAMSAT"
        subtitle="Generate surat untuk keperluan perpanjangan pajak kendaraan"
        icon={<Car />}
      />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Cari Nasabah (Agunan Kendaraan)
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="No Kontrak / Nama / No Polisi..."
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
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-800">
                          {n.nama}
                        </span>
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {n.kendaraan?.noPolisi}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 ml-6">
                        {n.kendaraan?.merk} {n.kendaraan?.type}{" "}
                        {n.kendaraan?.tahun}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Menampilkan nasabah dengan agunan kendaraan bermotor
            </p>
          </div>

          {selectedNasabah?.kendaraan && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                Data Kendaraan
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-500">No Polisi</p>
                  <p className="font-bold text-blue-800">
                    {selectedNasabah.kendaraan.noPolisi}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Merk / Type</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.kendaraan.merk}{" "}
                    {selectedNasabah.kendaraan.type}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Tahun</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.kendaraan.tahun}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">No BPKB</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.kendaraan.noBPKB}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:col-span-2">
                  <p className="text-xs text-gray-500">No Rangka</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.kendaraan.noRangka}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 md:col-span-2">
                  <p className="text-xs text-gray-500">No Mesin</p>
                  <p className="font-semibold text-gray-800">
                    {selectedNasabah.kendaraan.noMesin}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Surat
                  </label>
                  <select
                    value={jenisSurat}
                    onChange={(e) => setJenisSurat(e.target.value)}
                    className="select"
                  >
                    <option>Surat Pengantar Pajak</option>
                    <option>Surat Kuasa Pembayaran Pajak</option>
                    <option>Surat Keterangan Kepemilikan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Berlaku Sampai
                  </label>
                  <DatePickerInput
                    value={masaBerlaku}
                    onChange={setMasaBerlaku}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan
                  </label>
                  <input
                    type="text"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="input"
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
                  Generate Surat
                </button>
                <LegalViewButton onClick={handlePreview} className="shrink-0" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex md:items-center justify-between gap-4 mb-6 flex-col md:flex-row">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-500" />
            History Surat SAMSAT
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
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">
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
