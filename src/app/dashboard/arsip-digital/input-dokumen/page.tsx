"use client";

import { useMemo, useState } from "react";
import { Check, UploadCloud, FileText, Database } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import { useArsipDigitalMasterData } from "@/components/arsip-digital/ArsipDigitalMasterDataProvider";
import { useArsipDigitalWorkflow } from "@/components/arsip-digital/ArsipDigitalWorkflowProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";

type RestrictOption = "Ya" | "Tidak";

type FormState = {
  tempatPenyimpananId: string;
  jenisDokumenKode: string;
  namaDokumen: string;
  keterangan: string;
  restrict: RestrictOption;
};

const INITIAL_FORM_STATE: FormState = {
  tempatPenyimpananId: "",
  jenisDokumenKode: "",
  namaDokumen: "",
  keterangan: "",
  restrict: "Tidak",
};

export default function InputDokumenPage() {
  const { user } = useAuth();
  const { showToast } = useAppToast();
  const { tempatPenyimpanan, jenisDokumen } = useArsipDigitalMasterData();
  const { dokumen, createDokumen } = useArsipDigitalWorkflow();
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const tempatPenyimpananList = useMemo(() => {
    return tempatPenyimpanan
      .filter((t) => t.status === "Aktif")
      .map((t) => ({
        id: t.id,
        kodeKantor: t.kodeKantor,
        namaKantor: t.namaKantor,
        kodeLemari: t.kodeLemari,
        rak: t.rak,
      }));
  }, [tempatPenyimpanan]);

  const jenisDokumenList = useMemo(() => {
    return jenisDokumen
      .filter((j) => j.status === "Aktif")
      .map((j) => ({
        id: j.id,
        kode: j.kode,
        nama: j.nama,
        keterangan: j.keterangan,
      }));
  }, [jenisDokumen]);

  const kodeDokumen = useMemo(() => {
    if (!formData.tempatPenyimpananId || !formData.jenisDokumenKode) return "";

    const jenis = jenisDokumenList.find(
      (j) => j.kode === formData.jenisDokumenKode,
    );
    if (!jenis) return "";

    const now = new Date();
    const periode = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    const prefix = jenis.kode.replace(/\s+/g, "-").toUpperCase();
    const re = new RegExp(`^${prefix}-${periode}-(\\d{4})$`);

    const lastSequence = dokumen.reduce((max, d) => {
      const match = d.kode.match(re);
      if (!match) return max;
      const num = Number(match[1]);
      if (!Number.isFinite(num)) return max;
      return Math.max(max, num);
    }, 0);

    return `${prefix}-${periode}-${String(lastSequence + 1).padStart(4, "0")}`;
  }, [
    dokumen,
    formData.jenisDokumenKode,
    formData.tempatPenyimpananId,
    jenisDokumenList,
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.tempatPenyimpananId ||
      !formData.jenisDokumenKode ||
      !formData.namaDokumen
    ) {
      showToast("Mohon lengkapi semua field yang diperlukan", "warning");
      return;
    }

    if (!kodeDokumen) {
      showToast(
        "Kode dokumen belum terbentuk. Pilih parameter dahulu.",
        "warning",
      );
      return;
    }

    if (!file) {
      showToast("Mohon upload file dokumen", "warning");
      return;
    }

    const selectedTempat = tempatPenyimpananList.find(
      (item) => String(item.id) === formData.tempatPenyimpananId,
    );
    const selectedJenis = jenisDokumenList.find(
      (item) => item.kode === formData.jenisDokumenKode,
    );

    if (!selectedTempat || !selectedJenis) {
      showToast("Parameter dokumen belum valid. Silakan pilih ulang.", "warning");
      return;
    }

    setIsLoading(true);
    createDokumen({
      kode: kodeDokumen,
      jenisDokumen: selectedJenis.nama,
      namaDokumen: formData.namaDokumen.trim(),
      detail: formData.keterangan.trim() || formData.namaDokumen.trim(),
      userInput: user?.username ?? "SYSTEM",
      tempatPenyimpanan: selectedTempat.kodeLemari,
      tempatPenyimpananId: selectedTempat.id,
      isRestrict: formData.restrict === "Ya",
      fileUrl: "/documents/contoh-dok.pdf",
    });

    setIsLoading(false);
    showToast("Dokumen berhasil disimpan!", "success");
    setFormData(INITIAL_FORM_STATE);
    setFile(null);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Input Dokumen Digital"
        subtitle="Masukkan data dokumen baru ke dalam sistem arsip digital."
        icon={<UploadCloud />}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 lg:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Database className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Klasifikasi Arsip
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div>
                  <label
                    htmlFor="tempatPenyimpanan"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tempat Penyimpanan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tempatPenyimpanan"
                    name="tempatPenyimpananId"
                    value={formData.tempatPenyimpananId}
                    onChange={handleChange}
                    className="select"
                    required
                  >
                    <option value="">-- Pilih Tempat Penyimpanan --</option>
                    {tempatPenyimpananList.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.kodeKantor} - {item.namaKantor} |{" "}
                        {item.kodeLemari} ({item.rak})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="restrict"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Dokumen Restrict
                  </label>
                  <select
                    id="restrict"
                    name="restrict"
                    value={formData.restrict}
                    onChange={handleChange}
                    className="select"
                  >
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="jenisDokumen"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Jenis Dokumen <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="jenisDokumen"
                    name="jenisDokumenKode"
                    value={formData.jenisDokumenKode}
                    onChange={handleChange}
                    className="select"
                    required
                  >
                    <option value="">-- Pilih Jenis Dokumen --</option>
                    {jenisDokumenList.map((item) => (
                      <option key={item.id} value={item.kode}>
                        {item.nama} ({item.kode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <FileText className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Detail Dokumen
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label
                    htmlFor="kodeDokumen"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Kode Dokumen
                  </label>
                  <div className="relative">
                    <input
                      id="kodeDokumen"
                      type="text"
                      value={kodeDokumen || "Otomatis..."}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 text-sm tabular-nums"
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md border border-blue-100">
                        Auto
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="namaDokumen"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nama Dokumen <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="namaDokumen"
                    type="text"
                    name="namaDokumen"
                    value={formData.namaDokumen}
                    onChange={handleChange}
                    placeholder="Contoh: Akta Pendirian PT..."
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="keterangan"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Keterangan
                  </label>
                  <textarea
                    id="keterangan"
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    placeholder="Tambahkan detail keterangan dokumen disini..."
                    className="textarea"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UploadCloud className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  File Digital
                </h2>
              </div>

              <div>
                <label
                  htmlFor="fileInput"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Dokumen <span className="text-red-500">*</span>
                </label>
                <div
                  className={[
                    "file-upload",
                    "relative",
                    "group",
                    dragOver ? "dragover" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  <input
                    id="fileInput"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                       ${file ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-500 group-hover:bg-blue-100"}
                    `}
                    >
                      {file ? (
                        <Check className="w-8 h-8" />
                      ) : (
                        <UploadCloud className="w-8 h-8" />
                      )}
                    </div>

                    {file ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-2">
                          Siap untuk diupload
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">
                          Klik untuk upload atau drag & drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, Word, atau Gambar (Maks. 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setFormData(INITIAL_FORM_STATE);
                  setFile(null);
                }}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading || !file}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Simpan Dokumen</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
