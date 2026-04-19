"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Shield,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import {
  dummyNasabahLegal,
  dummyHistoryCetak,
  perusahaanAsuransiOptions,
  jenisAsuransiOptions,
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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default function CetakFormulirAsuransiPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNasabah, setSelectedNasabah] = useState<NasabahLegal | null>(
    null,
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [jenisFormulir, setJenisFormulir] = useState("Pendaftaran Baru");
  const [perusahaan, setPerusahaan] = useState(perusahaanAsuransiOptions[0] ?? "");
  const [jenisAsuransi, setJenisAsuransi] = useState(jenisAsuransiOptions[0] ?? "");
  const [nilaiPertanggungan, setNilaiPertanggungan] = useState("");
  const [periodeAwal, setPeriodeAwal] = useState("");
  const [periodeAkhir, setPeriodeAkhir] = useState("");
  const [noPolis, setNoPolis] = useState("");
  const [history, setHistory] = useState(dummyHistoryCetak);
  const [historySearch, setHistorySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredNasabah = useMemo(() => {
    if (!searchQuery) return [];
    return dummyNasabahLegal.filter(
      (n) =>
        n.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.noKontrak.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const handleSelectNasabah = (nasabah: NasabahLegal) => {
    setSelectedNasabah(nasabah);
    setSearchQuery(nasabah.nama);
    setShowDropdown(false);

    if (nasabah.asuransi) {
      setPerusahaan(nasabah.asuransi.perusahaan);
      setJenisAsuransi(nasabah.asuransi.jenisAsuransi);
      setNilaiPertanggungan(nasabah.asuransi.nilaiPertanggungan.toString());
      setPeriodeAwal(nasabah.asuransi.periodeAwal);
      setPeriodeAkhir(nasabah.asuransi.periodeAkhir);
      setNoPolis(nasabah.asuransi.noPolis);
      return;
    }

    const total = nasabah.plafond + nasabah.margin;
    setNilaiPertanggungan(total.toString());

    const start = parseDateString(nasabah.tanggalAkad ?? "") ?? new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    setPeriodeAwal(toIsoDate(start));
    setPeriodeAkhir(toIsoDate(end));
    setNoPolis("");
  };

  const handleGenerate = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }

    const nilai = Number.parseInt(nilaiPertanggungan || "0", 10);
    if (!Number.isFinite(nilai) || nilai <= 0) {
      showToast("Nilai pertanggungan belum valid!", "warning");
      return;
    }

    if (!periodeAwal || !periodeAkhir) {
      showToast("Periode asuransi belum diisi!", "warning");
      return;
    }

    if (periodeAwal > periodeAkhir) {
      showToast(
        "Periode akhir harus lebih besar dari periode awal!",
        "warning",
      );
      return;
    }

    downloadFile(
      "/documents/contoh-dok.pdf",
      `Formulir Asuransi - ${selectedNasabah.nama}.pdf`,
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
    const noSurat = `ASR/${String(history.length + 1).padStart(3, "0")}/${romanMonths[now.getMonth()]}/${now.getFullYear()}`;
    const newHistory = {
      id: history.length + 1,
      tanggal: toIsoDate(now),
      jenis: "Asuransi",
      noSurat,
      noKontrak: selectedNasabah.noKontrak,
      namaNasabah: selectedNasabah.nama,
      detail: `Formulir ${jenisFormulir} - ${jenisAsuransi}`,
      user: "SYSTEM",
    };
    setHistory([newHistory, ...history]);
    setCurrentPage(1);

    showToast(
      `Formulir ${jenisFormulir} berhasil di-export (prototype)!`,
      "success",
    );
  };

  const handlePreview = () => {
    if (!selectedNasabah) {
      showToast("Pilih nasabah terlebih dahulu!", "error");
      return;
    }
    openPreview(
      "/documents/contoh-dok.pdf",
      `Formulir Asuransi - ${selectedNasabah.nama}`,
    );
  };

  const filteredHistory = useMemo(() => {
    let result = history.filter((h) => h.jenis === "Asuransi");
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
      filename: "history_formulir_asuransi",
      sheetName: "History",
      title: "LAPORAN HISTORY FORMULIR ASURANSI",
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
        title="Cetak Formulir Asuransi"
        subtitle="Generate formulir pendaftaran, klaim, dan perubahan asuransi"
        icon={<Shield />}
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
                      <div className="font-medium text-gray-800">{n.nama}</div>
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-800">
                          {n.noKontrak}
                        </span>{" "}
                        • {n.produk}
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
                <Shield className="w-5 h-5 text-primary" />
                Detail Formulir Asuransi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Formulir
                  </label>
                  <select
                    value={jenisFormulir}
                    onChange={(e) => setJenisFormulir(e.target.value)}
                    className="select"
                  >
                    <option>Pendaftaran Baru</option>
                    <option>Klaim</option>
                    <option>Perubahan Polis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Perusahaan Asuransi
                  </label>
                  <select
                    value={perusahaan}
                    onChange={(e) => setPerusahaan(e.target.value)}
                    className="select"
                  >
                    {perusahaanAsuransiOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Asuransi
                  </label>
                  <select
                    value={jenisAsuransi}
                    onChange={(e) =>
                      setJenisAsuransi(
                        e.target.value as "Jiwa" | "Kebakaran" | "Kendaraan",
                      )
                    }
                    className="select"
                  >
                    {jenisAsuransiOptions.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nilai Pertanggungan
                  </label>
                  <input
                    type="text"
                    value={
                      nilaiPertanggungan
                        ? formatCurrency(
                            Number.parseInt(nilaiPertanggungan, 10),
                          )
                        : ""
                    }
                    onChange={(e) =>
                      setNilaiPertanggungan(e.target.value.replace(/\D/g, ""))
                    }
                    className="input"
                  />
                </div>
                {jenisFormulir !== "Pendaftaran Baru" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      No Polis
                    </label>
                    <input
                      type="text"
                      value={noPolis}
                      onChange={(e) => setNoPolis(e.target.value)}
                      className="input"
                      placeholder="POL-XXXX-XXXXX"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Periode Awal
                  </label>
                  <DatePickerInput
                    value={periodeAwal}
                    onChange={setPeriodeAwal}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Periode Akhir
                  </label>
                  <DatePickerInput
                    value={periodeAkhir}
                    onChange={setPeriodeAkhir}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="btn btn-primary flex-1"
                >
                  <Download className="w-5 h-5" />
                  Generate PDF
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
            <Shield className="w-5 h-5 text-primary" />
            History Formulir
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
