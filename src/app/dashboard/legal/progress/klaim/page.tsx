"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  Download,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  Edit2,
  DollarSign,
  UploadCloud,
} from "lucide-react";
import {
  dummyKlaimAsuransi,
  perusahaanAsuransiOptions,
  dummyNasabahLegal,
  KlaimAsuransi,
} from "@/lib/data";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import LegalViewButton from "@/components/legal/LegalViewButton";
import { useObjectUrlRegistry } from "@/hooks/useObjectUrlRegistry";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { formatDateDisplay, todayIsoDate } from "@/lib/utils/date";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default function KlaimAsuransiPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const { createObjectUrl, revokeObjectUrl } = useObjectUrlRegistry();
  const [data, setData] = useState(dummyKlaimAsuransi);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<KlaimAsuransi | null>(null);
  const [selectedItem, setSelectedItem] = useState<KlaimAsuransi | null>(null);

  const [formNoKontrak, setFormNoKontrak] = useState("");
  const [formNoPolis, setFormNoPolis] = useState("");
  const [formPerusahaan, setFormPerusahaan] = useState(
    perusahaanAsuransiOptions[0] ?? "",
  );
  const [formJenisKlaim, setFormJenisKlaim] = useState<
    | "Meninggal Dunia"
    | "Kecelakaan"
    | "Sakit Kritis"
    | "Kebakaran"
    | "Kehilangan"
  >("Meninggal Dunia");
  const [formNilaiKlaim, setFormNilaiKlaim] = useState("");
  const [formTanggalPengajuan, setFormTanggalPengajuan] = useState("");
  const [formStatus, setFormStatus] = useState<
    "Pengajuan" | "Verifikasi" | "Disetujui" | "Ditolak" | "Cair"
  >("Pengajuan");
  const [formNilaiCair, setFormNilaiCair] = useState("");
  const [formTanggalCair, setFormTanggalCair] = useState("");
  const [formAlasan, setFormAlasan] = useState("");
  const [formCatatan, setFormCatatan] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  const jenisKlaimOptions = [
    "Meninggal Dunia",
    "Kecelakaan",
    "Sakit Kritis",
    "Kebakaran",
    "Kehilangan",
  ];

  const summary = useMemo(() => {
    const totalNilai = data
      .filter((d) => d.status === "Cair")
      .reduce((sum, d) => sum + (d.nilaiCair || 0), 0);
    return {
      total: data.length,
      pengajuan: data.filter((d) => d.status === "Pengajuan").length,
      verifikasi: data.filter((d) => d.status === "Verifikasi").length,
      disetujui: data.filter((d) => d.status === "Disetujui").length,
      cair: data.filter((d) => d.status === "Cair").length,
      ditolak: data.filter((d) => d.status === "Ditolak").length,
      totalNilai,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (filterStatus !== "Semua")
      result = result.filter((d) => d.status === filterStatus);
    if (filterJenis !== "Semua")
      result = result.filter((d) => d.jenisKlaim === filterJenis);
    if (search)
      result = result.filter(
        (d) =>
          d.namaNasabah.toLowerCase().includes(search.toLowerCase()) ||
          d.noKontrak.toLowerCase().includes(search.toLowerCase()),
      );
    return result;
  }, [data, filterStatus, filterJenis, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  const validatePdfFile = (file: File): boolean => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      showToast("Lampiran harus berformat PDF.", "error");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran lampiran maksimal 5MB.", "error");
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    const nasabah = dummyNasabahLegal.find(
      (n) => n.noKontrak === formNoKontrak,
    );
    if (!nasabah) {
      showToast("No kontrak tidak ditemukan!", "error");
      return;
    }
    if (!formNoPolis.trim()) {
      showToast("No Polis wajib diisi!", "warning");
      return;
    }
    const nilaiKlaim = Number.parseInt(formNilaiKlaim, 10) || 0;
    if (nilaiKlaim <= 0) {
      showToast("Nilai klaim wajib diisi!", "warning");
      return;
    }
    if (!formTanggalPengajuan) {
      showToast("Tanggal wajib diisi!", "warning");
      return;
    }
    const newItem: KlaimAsuransi = {
      id: data.length + 1,
      noKontrak: formNoKontrak,
      namaNasabah: nasabah.nama,
      noPolis: formNoPolis,
      perusahaanAsuransi: formPerusahaan,
      jenisKlaim: formJenisKlaim,
      nilaiKlaim,
      tanggalPengajuan: formTanggalPengajuan,
      status: "Pengajuan",
      catatan: formCatatan,
      userInput: "SYSTEM",
      lampiranFilePath: formFile ? createObjectUrl(formFile) : undefined,
      lampiranFileName: formFile?.name,
      lampiranFileType: formFile ? "pdf" : undefined,
      lampiranFileSize: formFile?.size,
    };
    setData((current) => [newItem, ...current]);
    setShowAddModal(false);
    resetForm();
    showToast("Klaim berhasil diajukan!", "success");
  };

  const handleUpdate = () => {
    if (!selectedItem) return;
    const updates: Partial<KlaimAsuransi> = {
      status: formStatus,
      catatan: formCatatan || selectedItem.catatan,
    };
    if (formStatus === "Disetujui" || formStatus === "Cair") {
      const nilaiCair = Number.parseInt(formNilaiCair, 10) || 0;
      if (nilaiCair <= 0) {
        showToast(
          "Nominal pencairan wajib diisi saat status Disetujui.",
          "warning",
        );
        return;
      }
      if (!formTanggalCair) {
        showToast(
          "Tanggal pencairan wajib diisi saat status Disetujui.",
          "warning",
        );
        return;
      }
      updates.nilaiCair = nilaiCair;
      updates.tanggalCair = formTanggalCair;
    }
    if (formStatus === "Ditolak") {
      if (!formAlasan.trim()) {
        showToast("Alasan penolakan wajib diisi!", "warning");
        return;
      }
      updates.alasanTolak = formAlasan;
    }
    setData((current) =>
      current.map((item) =>
        item.id === selectedItem.id ? { ...item, ...updates } : item,
      ),
    );
    setShowUpdateModal(false);
    setSelectedItem(null);
    showToast("Status klaim berhasil diupdate!", "success");
  };

  const handleDelete = (id: number) => {
    if (confirm("Hapus data?")) {
      revokeObjectUrl(data.find((item) => item.id === id)?.lampiranFilePath);
      setData((current) => current.filter((item) => item.id !== id));
      showToast("Data berhasil dihapus!", "success");
    }
  };
  const resetForm = () => {
    setFormNoKontrak("");
    setFormNoPolis("");
    setFormPerusahaan(perusahaanAsuransiOptions[0] ?? "");
    setFormJenisKlaim("Meninggal Dunia");
    setFormNilaiKlaim("");
    setFormTanggalPengajuan("");
    setFormStatus("Pengajuan");
    setFormNilaiCair("");
    setFormTanggalCair("");
    setFormAlasan("");
    setFormCatatan("");
    setFormFile(null);
  };

  const handleExportExcel = async () => {
    await exportToExcel({
      filename: "klaim_asuransi",
      sheetName: "Klaim Asuransi",
      title: "LAPORAN KLAIM ASURANSI",
      columns: [
        { header: "No", key: "no", width: 5 },
        { header: "No Kontrak", key: "noKontrak", width: 15 },
        { header: "Nama", key: "namaNasabah", width: 20 },
        { header: "Jenis Klaim", key: "jenisKlaim", width: 18 },
        { header: "Nilai Klaim", key: "nilaiText", width: 15 },
        { header: "Nilai Cair", key: "cairText", width: 15 },
        { header: "Tgl Pengajuan", key: "tanggalPengajuan", width: 12 },
        { header: "Status", key: "status", width: 12 },
      ],
      data: filteredData.map((item, idx) => ({
        ...item,
        no: idx + 1,
        nilaiText: formatCurrency(item.nilaiKlaim),
        cairText: item.nilaiCair ? formatCurrency(item.nilaiCair) : "-",
      })),
    });
    showToast("Export Excel berhasil!", "success");
  };

  const getStatusBadge = (status: string) => {
    const classes: { [key: string]: string } = {
      Pengajuan: "bg-blue-100 text-blue-700",
      Verifikasi: "bg-yellow-100 text-yellow-700",
      Disetujui: "bg-green-100 text-green-700",
      Ditolak: "bg-red-100 text-red-700",
      Cair: "bg-emerald-100 text-emerald-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Klaim Asuransi"
        subtitle="Monitoring pengajuan dan pencairan klaim asuransi"
        icon={<AlertCircle />}
      />

      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-gray-900">
          Total: <span className="font-semibold">{data.length}</span> klaim
        </p>
        <button
          onClick={() => {
            setShowAddModal(true);
            setFormTanggalPengajuan(todayIsoDate());
          }}
          className="btn btn-upload"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Ajukan Klaim
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">Total Nilai Klaim Cair</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalNilai)}
              </p>
              <p className="text-xs text-gray-500">
                {summary.cair} klaim telah cair
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold text-gray-900">
              {summary.pengajuan + summary.verifikasi}
            </p>
            <p className="text-xs text-gray-500">Dalam Proses</p>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex flex-col items-center">
            <p className="text-2xl font-bold text-gray-900">
              {summary.ditolak}
            </p>
            <p className="text-xs text-gray-500">Ditolak</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Daftar Klaim
          </h2>
          <button
            onClick={handleExportExcel}
            className="btn btn-export-excel btn-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select"
          >
            <option value="Semua">Semua Status</option>
            <option value="Pengajuan">Pengajuan</option>
            <option value="Verifikasi">Verifikasi</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Cair">Cair</option>
            <option value="Ditolak">Ditolak</option>
          </select>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="select"
          >
            <option value="Semua">Semua Jenis</option>
            {jenisKlaimOptions.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="input input-with-icon"
            />
            <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  No Kontrak
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nasabah
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Jenis
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Nilai
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Pengajuan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Lampiran
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.noKontrak}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.namaNasabah}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {item.jenisKlaim}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(item.nilaiKlaim)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateDisplay(item.tanggalPengajuan)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.lampiranFilePath ? (
                      <LegalViewButton
                        onClick={() =>
                          openPreview(
                            normalizeFileUrl(item.lampiranFilePath!),
                            item.lampiranFileName ||
                              "tracking_claim_asuransi.pdf",
                            "pdf",
                          )
                        }
                        className="inline-flex"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setDetailItem(item);
                          setShowDetailModal(true);
                        }}
                        className="btn btn-outline btn-sm"
                        title="Detail"
                      >
                        Detail
                      </button>
                      {!["Cair", "Ditolak"].includes(item.status) && (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setFormStatus(item.status);
                            setFormNilaiCair(
                              item.nilaiCair ? String(item.nilaiCair) : "",
                            );
                            setFormTanggalCair(item.tanggalCair || "");
                            setFormAlasan("");
                            setFormCatatan(item.catatan || "");
                            setShowUpdateModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-100"
                          title="Update"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
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
              Halaman {currentPage} dari {totalPages}
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

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Ajukan Klaim Asuransi</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    No Kontrak
                  </label>
                  <input
                    type="text"
                    list="nasabah-kontrak-klaim"
                    value={formNoKontrak}
                    onChange={(e) => setFormNoKontrak(e.target.value)}
                    className="input"
                    placeholder="PB/2024/001234"
                  />
                  <datalist id="nasabah-kontrak-klaim">
                    {dummyNasabahLegal.map((n) => (
                      <option
                        key={n.noKontrak}
                        value={n.noKontrak}
                        label={n.nama}
                      />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-500 mt-1">
                    Tips: pilih No Kontrak dari daftar agar data nasabah valid.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    No Polis
                  </label>
                  <input
                    type="text"
                    value={formNoPolis}
                    onChange={(e) => setFormNoPolis(e.target.value)}
                    className="input"
                    placeholder="POL-XXXX-XXXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Perusahaan
                  </label>
                  <select
                    value={formPerusahaan}
                    onChange={(e) => setFormPerusahaan(e.target.value)}
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
                    Jenis Klaim
                  </label>
                  <select
                    value={formJenisKlaim}
                    onChange={(e) =>
                      setFormJenisKlaim(e.target.value as typeof formJenisKlaim)
                    }
                    className="select"
                  >
                    {jenisKlaimOptions.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nilai Klaim
                </label>
                <input
                  type="text"
                  value={
                    formNilaiKlaim
                      ? formatCurrency(Number.parseInt(formNilaiKlaim, 10))
                      : ""
                  }
                  onChange={(e) =>
                    setFormNilaiKlaim(e.target.value.replace(/\D/g, ""))
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal
                </label>
                <DatePickerInput
                  value={formTanggalPengajuan}
                  onChange={setFormTanggalPengajuan}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Lampiran (PDF, maks 5MB) - Opsional
                </label>
                <div
                  className="file-upload"
                  onClick={() =>
                    document.getElementById("trackingClaimFile")?.click()
                  }
                >
                  <input
                    id="trackingClaimFile"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (!e.target.files?.[0]) return;
                      const nextFile = e.target.files[0];
                      if (!validatePdfFile(nextFile)) return;
                      setFormFile(nextFile);
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <UploadCloud
                      className="w-10 h-10 text-[#157ec3] mb-2"
                      aria-hidden="true"
                    />
                    {formFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {formFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(formFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          Klik untuk pilih PDF
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Hanya PDF, maksimal 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  rows={2}
                  className="textarea"
                  placeholder="Detail kejadian..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button onClick={handleAdd} className="btn btn-upload flex-1">
                Ajukan
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowUpdateModal(false);
            setSelectedItem(null);
            setFormTanggalCair("");
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Status Klaim</h3>
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedItem(null);
                  setFormTanggalCair("");
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl mb-4">
              <p className="text-sm text-orange-800">
                <strong>{selectedItem.namaNasabah}</strong>
              </p>
              <p className="text-sm text-orange-600">
                {selectedItem.jenisKlaim} -{" "}
                {formatCurrency(selectedItem.nilaiKlaim)}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) =>
                    setFormStatus(e.target.value as typeof formStatus)
                  }
                  className="select"
                >
                  <option value="Pengajuan">Pengajuan</option>
                  <option value="Verifikasi">Verifikasi</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Cair">Cair</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
              {(formStatus === "Disetujui" || formStatus === "Cair") && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nominal Pencairan
                    </label>
                    <input
                      type="text"
                      value={
                        formNilaiCair
                          ? formatCurrency(Number.parseInt(formNilaiCair, 10))
                          : ""
                      }
                      onChange={(e) =>
                        setFormNilaiCair(e.target.value.replace(/\D/g, ""))
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tanggal Pencairan
                    </label>
                    <DatePickerInput
                      value={formTanggalCair}
                      onChange={setFormTanggalCair}
                    />
                    {formStatus === "Disetujui" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Wajib diisi saat status disetujui.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {formStatus === "Ditolak" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Alasan Penolakan
                  </label>
                  <textarea
                    value={formAlasan}
                    onChange={(e) => setFormAlasan(e.target.value)}
                    rows={2}
                    className="textarea"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  rows={2}
                  className="textarea"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedItem(null);
                  setFormTanggalCair("");
                }}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button onClick={handleUpdate} className="btn btn-primary flex-1">
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowDetailModal(false);
            setDetailItem(null);
          }}
        >
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
                  }}
                >
                  <AlertCircle
                    className="w-6 h-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Detail Klaim Asuransi
                  </h2>
                  <p className="text-sm text-gray-500">
                    {detailItem.noKontrak}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Nama Nasabah</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.namaNasabah}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Perusahaan</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.perusahaanAsuransi}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">No Polis</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.noPolis}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Jenis Klaim</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.jenisKlaim}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Nilai Klaim</label>
                  <p className="font-medium text-gray-800">
                    {formatCurrency(detailItem.nilaiKlaim)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Tanggal Pengajuan
                  </label>
                  <p className="font-medium text-gray-800">
                    {formatDateDisplay(detailItem.tanggalPengajuan)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(detailItem.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">User Input</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.userInput}
                  </p>
                </div>
              </div>
            </div>

            {(detailItem.status === "Disetujui" ||
              detailItem.status === "Cair") && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Informasi Pencairan
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">
                      Nominal Pencairan
                    </label>
                    <p className="font-medium text-gray-800">
                      {detailItem.nilaiCair
                        ? formatCurrency(detailItem.nilaiCair)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">
                      Tanggal Pencairan
                    </label>
                    <p className="font-medium text-gray-800">
                      {formatDateDisplay(detailItem.tanggalCair)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {detailItem.status === "Ditolak" && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Alasan Penolakan
                </h3>
                <p className="text-sm text-gray-700">
                  {detailItem.alasanTolak?.trim()
                    ? detailItem.alasanTolak
                    : "-"}
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Catatan</h3>
              <p className="text-sm text-gray-700">
                {detailItem.catatan?.trim() ? detailItem.catatan : "-"}
              </p>
            </div>

            {detailItem.lampiranFilePath && (
              <LegalViewButton
                onClick={() =>
                  openPreview(
                    normalizeFileUrl(detailItem.lampiranFilePath!),
                    detailItem.lampiranFileName ||
                      "tracking_claim_asuransi.pdf",
                    "pdf",
                  )
                }
                className="mb-4 w-full justify-center"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
