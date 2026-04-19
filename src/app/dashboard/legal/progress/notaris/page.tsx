"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Filter,
  Plus,
  Scale,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  MasterNotaris,
  ProgressNotaris,
  dummyMasterNotaris,
  dummyNasabahLegal,
  dummyProgressNotaris,
  jenisAktaOptions,
} from "@/lib/data";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import LegalViewButton from "@/components/legal/LegalViewButton";
import { useObjectUrlRegistry } from "@/hooks/useObjectUrlRegistry";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { formatDateDisplay, todayIsoDate } from "@/lib/utils/date";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";

export default function ProgressNotarisPage() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const { createObjectUrl, replaceObjectUrl, revokeObjectUrl } =
    useObjectUrlRegistry();

  const [data, setData] = useState<ProgressNotaris[]>(dummyProgressNotaris);
  const [masterNotaris, setMasterNotaris] = useState<MasterNotaris[]>(
    dummyMasterNotaris.filter((item) => item.status === "Aktif"),
  );
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterNotaris, setFilterNotaris] = useState("Semua");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProgressNotaris | null>(
    null,
  );
  const [detailItem, setDetailItem] = useState<ProgressNotaris | null>(null);

  const [formNoKontrak, setFormNoKontrak] = useState("");
  const [formNotarisId, setFormNotarisId] = useState<number>(
    dummyMasterNotaris[0]?.id ?? 0,
  );
  const [formJenisAkta, setFormJenisAkta] = useState<
    "APHT" | "Fidusia" | "Roya" | "Surat Kuasa"
  >("APHT");
  const [formStatus, setFormStatus] = useState<
    "Proses" | "Selesai" | "Bermasalah"
  >("Proses");
  const [formTanggalMasuk, setFormTanggalMasuk] = useState("");
  const [formEstimasiSelesai, setFormEstimasiSelesai] = useState("");
  const [formNoAkta, setFormNoAkta] = useState("");
  const [formCatatan, setFormCatatan] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [updateFile, setUpdateFile] = useState<File | null>(null);

  const [newNotarisName, setNewNotarisName] = useState("");
  const [newNotarisKantor, setNewNotarisKantor] = useState("");

  const summary = useMemo(
    () => ({
      total: data.length,
      proses: data.filter((item) => item.status === "Proses").length,
      selesai: data.filter((item) => item.status === "Selesai").length,
      bermasalah: data.filter((item) => item.status === "Bermasalah").length,
    }),
    [data],
  );

  const filteredData = useMemo(() => {
    let result = [...data];
    if (filterStatus !== "Semua") {
      result = result.filter((item) => item.status === filterStatus);
    }
    if (filterNotaris !== "Semua") {
      result = result.filter((item) => item.namaNotaris === filterNotaris);
    }
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.noKontrak.toLowerCase().includes(keyword) ||
          item.namaNasabah.toLowerCase().includes(keyword),
      );
    }
    return result;
  }, [data, filterNotaris, filterStatus, search]);

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

  const validatePdf = (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      showToast("Lampiran harus PDF.", "error");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran lampiran maksimal 5MB.", "error");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setFormNoKontrak("");
    setFormNotarisId(masterNotaris[0]?.id ?? 0);
    setFormJenisAkta("APHT");
    setFormStatus("Proses");
    setFormTanggalMasuk("");
    setFormEstimasiSelesai("");
    setFormNoAkta("");
    setFormCatatan("");
    setFormFile(null);
    setNewNotarisName("");
    setNewNotarisKantor("");
  };

  const addMasterNotaris = () => {
    if (!newNotarisName.trim()) {
      showToast("Nama notaris wajib diisi.", "warning");
      return;
    }
    const exists = masterNotaris.some(
      (item) => item.nama.toLowerCase() === newNotarisName.trim().toLowerCase(),
    );
    if (exists) {
      showToast("Nama notaris sudah ada.", "warning");
      return;
    }
    const nextId = Math.max(0, ...masterNotaris.map((item) => item.id)) + 1;
    const newMaster: MasterNotaris = {
      id: nextId,
      nama: newNotarisName.trim(),
      kantor: newNotarisKantor.trim() || "-",
      telepon: "-",
      status: "Aktif",
    };
    setMasterNotaris((prev) => [...prev, newMaster]);
    setFormNotarisId(nextId);
    setNewNotarisName("");
    setNewNotarisKantor("");
    showToast("Master notaris ditambahkan.", "success");
  };

  const handleAdd = () => {
    const nasabah = dummyNasabahLegal.find(
      (item) => item.noKontrak === formNoKontrak.trim(),
    );
    if (!nasabah) {
      showToast("No kontrak tidak valid.", "error");
      return;
    }
    if (!formEstimasiSelesai) {
      showToast("Estimasi selesai wajib diisi.", "warning");
      return;
    }
    const notaris = masterNotaris.find((item) => item.id === formNotarisId);
    if (!notaris) {
      showToast("Notaris tidak valid.", "error");
      return;
    }

    const next: ProgressNotaris = {
      id: Math.max(0, ...data.map((item) => item.id)) + 1,
      noKontrak: formNoKontrak.trim(),
      namaNasabah: nasabah.nama,
      notarisId: notaris.id,
      namaNotaris: notaris.nama,
      jenisAkta: formJenisAkta,
      tanggalMasuk: formTanggalMasuk || todayIsoDate(),
      estimasiSelesai: formEstimasiSelesai,
      status: "Proses",
      userInput: "SYSTEM",
      catatan: formCatatan,
      lampiranFilePath: formFile ? createObjectUrl(formFile) : undefined,
      lampiranFileName: formFile?.name,
      lampiranFileType: formFile ? "pdf" : undefined,
      lampiranFileSize: formFile?.size,
    };

    setData((prev) => [next, ...prev]);
    setShowAddModal(false);
    resetForm();
    showToast("Progress notaris ditambahkan.", "success");
  };

  const handleUpdate = () => {
    if (!selectedItem) return;
    if (
      formStatus === "Selesai" &&
      !(formNoAkta.trim() || selectedItem.noAkta?.trim())
    ) {
      showToast("No Akta wajib untuk status Selesai.", "warning");
      return;
    }

    const nextLampiranFilePath = updateFile
      ? replaceObjectUrl(updateFile, selectedItem.lampiranFilePath)
      : selectedItem.lampiranFilePath;

    setData((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: formStatus,
              noAkta: formNoAkta.trim() || item.noAkta,
              tanggalSelesai:
                formStatus === "Selesai" ? todayIsoDate() : item.tanggalSelesai,
              catatan: formCatatan.trim() || item.catatan,
              lampiranFilePath: nextLampiranFilePath,
              lampiranFileName: updateFile
                ? updateFile.name
                : item.lampiranFileName,
              lampiranFileType: updateFile ? "pdf" : item.lampiranFileType,
              lampiranFileSize: updateFile
                ? updateFile.size
                : item.lampiranFileSize,
            }
          : item,
      ),
    );

    setShowUpdateModal(false);
    setSelectedItem(null);
    setUpdateFile(null);
    showToast("Progress notaris diupdate.", "success");
  };

  const handleDelete = (id: number) => {
    if (!confirm("Hapus data progress notaris?")) return;
    revokeObjectUrl(data.find((item) => item.id === id)?.lampiranFilePath);
    setData((prev) => prev.filter((item) => item.id !== id));
    showToast("Data dihapus.", "success");
  };

  const handleExportExcel = async () => {
    await exportToExcel({
      filename: "progress_notaris",
      sheetName: "Progress Notaris",
      title: "LAPORAN PROGRESS NOTARIS",
      columns: [
        { header: "No", key: "no", width: 5 },
        { header: "No Kontrak", key: "noKontrak", width: 18 },
        { header: "Nama", key: "namaNasabah", width: 22 },
        { header: "Notaris", key: "namaNotaris", width: 20 },
        { header: "Jenis", key: "jenisAkta", width: 14 },
        { header: "Tanggal Masuk", key: "tanggalMasuk", width: 14 },
        { header: "Estimasi", key: "estimasiSelesai", width: 14 },
        { header: "Status", key: "status", width: 12 },
      ],
      data: filteredData.map((item, idx) => ({ ...item, no: idx + 1 })),
    });
    showToast("Export Excel berhasil.", "success");
  };

  const statusBadge = (status: string) => {
    const classes: Record<string, string> = {
      Proses: "bg-yellow-100 text-yellow-700",
      Selesai: "bg-green-100 text-green-700",
      Bermasalah: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status] || "bg-gray-100 text-gray-700"}`}
      >
        {status}
      </span>
    );
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Progress Notaris"
        subtitle="Monitoring progress pengerjaan akta notaris"
        icon={<Scale />}
      />

      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-gray-900">
          Total: <span className="font-semibold">{data.length}</span> progress
        </p>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn btn-upload"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Tambah Progress
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniCard
          label="Total"
          value={summary.total}
          icon={<Scale className="w-6 h-6 text-blue-600" />}
          iconWrapperClassName="bg-blue-100"
        />
        <MiniCard
          label="Proses"
          value={summary.proses}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          iconWrapperClassName="bg-yellow-100"
        />
        <MiniCard
          label="Selesai"
          value={summary.selesai}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          iconWrapperClassName="bg-green-100"
        />
        <MiniCard
          label="Bermasalah"
          value={summary.bermasalah}
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconWrapperClassName="bg-red-100"
        />
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Daftar Progress
          </h2>
          <button
            type="button"
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
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Bermasalah">Bermasalah</option>
          </select>
          <select
            value={filterNotaris}
            onChange={(e) => setFilterNotaris(e.target.value)}
            className="select"
          >
            <option value="Semua">Semua Notaris</option>
            {masterNotaris.map((item) => (
              <option key={item.id} value={item.nama}>
                {item.nama}
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
                  Notaris
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Jenis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Masuk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Estimasi
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Lampiran
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
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
                  <td className="px-4 py-3 text-sm">{item.namaNotaris}</td>
                  <td className="px-4 py-3 text-sm">{item.jenisAkta}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateDisplay(item.tanggalMasuk)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateDisplay(item.estimasiSelesai)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.lampiranFilePath ? (
                      <LegalViewButton
                        onClick={() =>
                          openPreview(
                            normalizeFileUrl(item.lampiranFilePath!),
                            item.lampiranFileName || "progress_notaris.pdf",
                            "pdf",
                          )
                        }
                        className="inline-flex"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailItem(item);
                          setShowDetailModal(true);
                        }}
                        className="btn btn-outline btn-sm"
                        title="Detail"
                      >
                        Detail
                      </button>
                      {item.status !== "Selesai" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setFormStatus(item.status);
                            setFormNoAkta(item.noAkta || "");
                            setFormCatatan(item.catatan || "");
                            setUpdateFile(null);
                            setShowUpdateModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-100"
                          title="Update"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                      <button
                        type="button"
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
                    colSpan={9}
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
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
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
        <div className="modal-overlay" onClick={closeAddModal}>
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tambah Progress Notaris</h3>
              <button
                type="button"
                onClick={closeAddModal}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Master Data Notaris
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newNotarisName}
                    onChange={(e) => setNewNotarisName(e.target.value)}
                    className="input"
                    placeholder="Nama notaris baru"
                  />
                  <input
                    type="text"
                    value={newNotarisKantor}
                    onChange={(e) => setNewNotarisKantor(e.target.value)}
                    className="input"
                    placeholder="Kantor"
                  />
                  <button
                    type="button"
                    onClick={addMasterNotaris}
                    className="btn btn-upload"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Master
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No Kontrak
                </label>
                <input
                  type="text"
                  list="nasabah-kontrak-notaris"
                  value={formNoKontrak}
                  onChange={(e) => setFormNoKontrak(e.target.value)}
                  className="input"
                  placeholder="PB/2024/001234"
                />
                <datalist id="nasabah-kontrak-notaris">
                  {dummyNasabahLegal.map((item) => (
                    <option
                      key={item.noKontrak}
                      value={item.noKontrak}
                      label={item.nama}
                    />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notaris
                  </label>
                  <select
                    value={formNotarisId}
                    onChange={(e) => setFormNotarisId(Number(e.target.value))}
                    className="select"
                  >
                    {masterNotaris.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Akta
                  </label>
                  <select
                    value={formJenisAkta}
                    onChange={(e) =>
                      setFormJenisAkta(e.target.value as typeof formJenisAkta)
                    }
                    className="select"
                  >
                    {jenisAktaOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Masuk
                  </label>
                  <DatePickerInput
                    value={formTanggalMasuk}
                    onChange={setFormTanggalMasuk}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estimasi Selesai
                  </label>
                  <DatePickerInput
                    value={formEstimasiSelesai}
                    onChange={setFormEstimasiSelesai}
                  />
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
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Lampiran (PDF, maks 5MB) - Opsional
                </label>
                <div
                  className="file-upload"
                  onClick={() =>
                    document.getElementById("fileNotarisAdd")?.click()
                  }
                >
                  <input
                    id="fileNotarisAdd"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (!e.target.files?.[0]) return;
                      const nextFile = e.target.files[0];
                      if (!validatePdf(nextFile)) return;
                      setFormFile(nextFile);
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-[#157ec3] mb-2" />
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeAddModal}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="btn btn-upload flex-1"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => setShowUpdateModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Progress</h3>
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
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
                  <option value="Proses">Proses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Bermasalah">Bermasalah</option>
                </select>
              </div>

              {formStatus === "Selesai" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    No Akta
                  </label>
                  <input
                    type="text"
                    value={formNoAkta}
                    onChange={(e) => setFormNoAkta(e.target.value)}
                    className="input"
                    placeholder="APHT/001/I/2026"
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Lampiran (PDF, maks 5MB) - Opsional
                </label>
                <div
                  className="file-upload"
                  onClick={() =>
                    document.getElementById("fileNotarisUpdate")?.click()
                  }
                >
                  <input
                    id="fileNotarisUpdate"
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      if (!e.target.files?.[0]) return;
                      const nextFile = e.target.files[0];
                      if (!validatePdf(nextFile)) return;
                      setUpdateFile(nextFile);
                    }}
                  />
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-[#157ec3] mb-2" />
                    {updateFile ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700">
                          {updateFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(updateFile.size / 1024).toFixed(2)} KB
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUpdateModal(false)}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="btn btn-primary flex-1"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailItem && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Detail Progress Notaris
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <InfoRow label="No Kontrak" value={detailItem.noKontrak} />
              <InfoRow label="Nama Nasabah" value={detailItem.namaNasabah} />
              <InfoRow label="Notaris" value={detailItem.namaNotaris} />
              <InfoRow label="Jenis Akta" value={detailItem.jenisAkta} />
              <InfoRow
                label="Tanggal Masuk"
                value={formatDateDisplay(detailItem.tanggalMasuk)}
              />
              <InfoRow
                label="Estimasi Selesai"
                value={formatDateDisplay(detailItem.estimasiSelesai)}
              />
              <InfoRow label="Status" value={detailItem.status} />
              <InfoRow label="No Akta" value={detailItem.noAkta || "-"} />
              <InfoRow
                label="Tanggal Selesai"
                value={formatDateDisplay(detailItem.tanggalSelesai)}
              />
              <InfoRow label="User Input" value={detailItem.userInput} />
            </div>

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
                    detailItem.lampiranFileName || "progress_notaris.pdf",
                    "pdf",
                  )
                }
                className="w-full justify-center"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniCard({
  label,
  value,
  icon,
  iconWrapperClassName = "bg-gray-100",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconWrapperClassName?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconWrapperClassName}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-xl">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}
