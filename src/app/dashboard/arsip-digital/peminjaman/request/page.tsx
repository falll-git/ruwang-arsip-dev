"use client";

import { useMemo, useState } from "react";
import { BookOpen, Search, Send, X, FileText } from "lucide-react";
import DatePickerInput from "@/components/ui/DatePickerInput";
import UiverseCheckbox from "@/components/ui/UiverseCheckbox";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { RBAC_DENIED_MESSAGE, filterDigitalDocuments } from "@/lib/rbac";
import { useArsipDigitalMasterData } from "@/components/arsip-digital/ArsipDigitalMasterDataProvider";
import { useArsipDigitalWorkflow } from "@/components/arsip-digital/ArsipDigitalWorkflowProvider";

export default function RequestPeminjamanPage() {
  const { role, user } = useAuth();
  const { showToast } = useAppToast();
  const { tempatPenyimpanan } = useArsipDigitalMasterData();
  const { dokumen, submitPeminjaman } = useArsipDigitalWorkflow();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    tanggalPeminjaman: "",
    tanggalPengembalian: "",
    alasan: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const dokumenList = useMemo(() => {
    if (!role) return [];
    const accessibleDokumen = filterDigitalDocuments(
      user?.is_restrict ?? false,
      dokumen,
    );
    return accessibleDokumen.map((d) => {
      const tempat = tempatPenyimpanan.find(
        (t) => t.id === d.tempatPenyimpananId,
      );
      return {
        id: d.id,
        kode: d.kode,
        jenisDokumen: d.jenisDokumen,
        namaDokumen: d.namaDokumen,
        detail: d.detail,
        status: d.statusPinjam,
        lokasi: tempat
          ? `${tempat.namaKantor} - ${tempat.kodeLemari} (${tempat.rak})`
          : `Tempat ID: ${d.tempatPenyimpananId}`,
      };
    });
  }, [dokumen, role, tempatPenyimpanan, user?.is_restrict]);

  const filteredDokumen = dokumenList.filter(
    (doc) =>
      doc.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.kode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCheckbox = (id: number) => {
    const doc = dokumenList.find((d) => d.id === id);
    if (!doc) return;
    if (doc.status !== "Tersedia") return;

    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const availableDocs = filteredDokumen.filter(
      (d) => d.status === "Tersedia",
    );
    if (selectedDocs.length === availableDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(availableDocs.map((d) => d.id));
    }
  };

  const handleSubmit = () => {
    const selectedDocuments = dokumenList.filter((d) =>
      selectedDocs.includes(d.id),
    );
    if (selectedDocs.length > 0 && selectedDocuments.length === 0) {
      showToast(RBAC_DENIED_MESSAGE, "warning");
      setSelectedDocs([]);
      return;
    }

    if (
      !formData.tanggalPeminjaman ||
      !formData.tanggalPengembalian ||
      !formData.alasan.trim()
    ) {
      showToast("Mohon lengkapi semua field yang diperlukan", "warning");
      return;
    }

    const created = submitPeminjaman({
      dokumenIds: selectedDocs,
      tanggalPeminjaman: formData.tanggalPeminjaman,
      tanggalPengembalian: formData.tanggalPengembalian,
      alasan: formData.alasan,
      peminjam: user?.username ?? "SYSTEM",
    });

    if (created === 0) {
      showToast("Tidak ada dokumen tersedia untuk diajukan", "warning");
      return;
    }

    setIsLoading(true);
    setIsLoading(false);
    setShowModal(false);
    showToast(
      `Permohonan peminjaman berhasil diajukan (${created} dokumen)!`,
      "success",
    );
    setSelectedDocs([]);
    setFormData({
      tanggalPeminjaman: "",
      tanggalPengembalian: "",
      alasan: "",
    });
  };

  const selectedDocuments = dokumenList.filter((d) =>
    selectedDocs.includes(d.id),
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <FeatureHeader
        title="Request Peminjaman"
        subtitle="Ajukan permohonan peminjaman dokumen fisik."
        icon={<BookOpen />}
      />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-2xl mb-8">
        <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
          Prosedur Peminjaman:
        </h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-blue-700">
          <li>Pilih dokumen (status &quot;Tersedia&quot;).</li>
          <li>
            Klik tombol{" "}
            <span className="font-bold">&quot;Ajukan Pinjam&quot;</span>.
          </li>
          <li>Isi tanggal pinjam, kembali, dan alasan.</li>
          <li>Tunggu persetujuan Legal.</li>
        </ol>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex-1 w-full">
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
                placeholder="Cari berdasarkan nama atau kode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-with-icon"
              />
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={selectedDocs.length === 0}
            className="btn btn-primary px-6 py-2.5 transition-all"
          >
            <Send className="w-4 h-4 mr-2" aria-hidden="true" />
            Ajukan Pinjam{" "}
            <span className="ml-1 bg-white/20 px-2 py-0.5 rounded text-xs">
              {selectedDocs.length}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-16 px-6 py-3 text-center">
                  <div className="flex justify-center">
                    <UiverseCheckbox
                      checked={
                        selectedDocs.length ===
                          filteredDokumen.filter((d) => d.status === "Tersedia")
                            .length &&
                        filteredDokumen.filter((d) => d.status === "Tersedia")
                          .length > 0
                      }
                      onCheckedChange={() => handleSelectAll()}
                      ariaLabel="Pilih semua dokumen tersedia"
                      size={20}
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Jenis Dokumen
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                  Nama Dokumen
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                  Detail
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDokumen.map((doc) => (
                <tr
                  key={doc.id}
                  className={`group transition-colors cursor-pointer hover:bg-blue-50/40 
                    ${selectedDocs.includes(doc.id) ? "bg-blue-50/60" : ""} 
                    ${doc.status !== "Tersedia" ? "bg-gray-50/50" : ""}
                  `}
                  onClick={() => handleCheckbox(doc.id)}
                >
                  <td
                    className="px-6 py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-center">
                      <UiverseCheckbox
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={() => handleCheckbox(doc.id)}
                        disabled={doc.status !== "Tersedia"}
                        ariaLabel={`Pilih dokumen ${doc.kode}`}
                        size={20}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100 text-xs font-medium tabular-nums">
                      {doc.kode}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-800">
                    {doc.jenisDokumen}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-800">
                    {doc.namaDokumen}
                  </td>
                  <td
                    className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate"
                    title={doc.detail}
                  >
                    {doc.detail}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {doc.lokasi}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${
                          doc.status === "Tersedia"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Send className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Form Permohonan
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Dokumen yang Akan Dipinjam ({selectedDocuments.length})
                </label>
                <div className="bg-gray-50 rounded-xl border border-gray-100 max-h-32 overflow-y-auto divide-y divide-gray-100">
                  {selectedDocuments.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {doc.namaDokumen}
                          </p>
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded tabular-nums">
                            {doc.kode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {doc.lokasi}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Detail: {doc.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Peminjaman <span className="text-red-500">*</span>
                  </label>
                  <DatePickerInput
                    value={formData.tanggalPeminjaman}
                    onChange={(nextValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        tanggalPeminjaman: nextValue,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tanggal Pengembalian <span className="text-red-500">*</span>
                  </label>
                  <DatePickerInput
                    value={formData.tanggalPengembalian}
                    onChange={(nextValue) =>
                      setFormData((prev) => ({
                        ...prev,
                        tanggalPengembalian: nextValue,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan Peminjaman <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.alasan}
                  onChange={(e) =>
                    setFormData({ ...formData, alasan: e.target.value })
                  }
                  placeholder="Jelaskan detail kebutuhan peminjaman fisik..."
                  className="textarea resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.tanggalPeminjaman ||
                  !formData.tanggalPengembalian ||
                  !formData.alasan.trim() ||
                  isLoading
                }
                className="btn btn-primary"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Ajukan Permohonan
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
