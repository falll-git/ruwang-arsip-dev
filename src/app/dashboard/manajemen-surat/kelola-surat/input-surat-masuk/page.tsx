"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Inbox, Search, Send, UploadCloud, X } from "lucide-react";
import FeatureHeader from "@/components/ui/FeatureHeader";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useAppToast } from "@/components/ui/AppToastProvider";
import UiverseCheckbox from "@/components/ui/UiverseCheckbox";
import { useAuth } from "@/components/auth/AuthProvider";
import TenggatWaktuModal from "@/components/surat/TenggatWaktuModal";
import { readFileAsBase64, validatePersuratanFile } from "@/lib/utils/file";
import { toApiDateTime } from "@/services/api.utils";
import { letterPriorityService } from "@/services/letter-priority.service";
import { suratMasukService } from "@/services/surat-masuk.service";
import { userService } from "@/services/user.service";

type DisposisiUserOption = {
  id: string;
  nama: string;
  divisi: string;
};

type SuratMasukDraft = {
  namaPengirim: string;
  alamatPengirim: string;
  namaSurat: string;
  perihalSurat: string;
  keteranganSurat: string;
  tanggalPenerimaan: string;
  sifatSurat: string;
  disposisiKepada: string[];
  fileName?: string;
  tenggatWaktu?: string;
  keteranganTenggat?: string;
};

export default function InputSuratMasukPage() {
  const { user } = useAuth();
  const { showToast } = useAppToast();
  const [formData, setFormData] = useState({
    namaPengirim: "",
    alamatPengirim: "",
    namaSurat: "",
    perihalSurat: "",
    keteranganSurat: "",
    tanggalPenerimaan: "",
    sifatSurat: "",
  });
  const [selectedDisposisi, setSelectedDisposisi] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [savedSurat, setSavedSurat] = useState<SuratMasukDraft | null>(null);
  const [isTenggatModalOpen, setIsTenggatModalOpen] = useState(false);
  const [disposisiSearch, setDisposisiSearch] = useState("");
  const [disposisiUsers, setDisposisiUsers] = useState<DisposisiUserOption[]>(
    [],
  );
  const [letterPriorities, setLetterPriorities] = useState<
    { id: string; name: string }[]
  >([]);
  const [isMasterLoading, setIsMasterLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadMasterData() {
      setIsMasterLoading(true);
      try {
        const [priorities, users] = await Promise.all([
          letterPriorityService.getAll(),
          userService.getAll(),
        ]);

        if (ignore) return;

        setLetterPriorities(
          priorities.map((item) => ({ id: item.id, name: item.name })),
        );
        setDisposisiUsers(
          users
            .filter((item) => item.is_active)
            .map((item) => ({
              id: item.id,
              nama: item.name,
              divisi: item.division_name ?? item.division_id,
            }))
            .sort((left, right) => left.nama.localeCompare(right.nama)),
        );
      } catch (error) {
        if (!ignore) {
          showToast(
            error instanceof Error
              ? error.message
              : "Gagal memuat master surat masuk",
            "error",
          );
        }
      } finally {
        if (!ignore) setIsMasterLoading(false);
      }
    }

    void loadMasterData();

    return () => {
      ignore = true;
    };
  }, [showToast]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDisposisiToggle = (userId: string) => {
    setSelectedDisposisi((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const nextFile = e.target.files[0];
      const validationMessage = validatePersuratanFile(nextFile);

      if (validationMessage) {
        e.target.value = "";
        setFile(null);
        showToast(validationMessage, "error");
        return;
      }

      setFile(nextFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const nextFile = e.dataTransfer.files[0];
      const validationMessage = validatePersuratanFile(nextFile);

      if (validationMessage) {
        setFile(null);
        showToast(validationMessage, "error");
        return;
      }

      setFile(nextFile);
    }
  };

  const handleReset = () => {
    setFormData({
      namaPengirim: "",
      alamatPengirim: "",
      namaSurat: "",
      perihalSurat: "",
      keteranganSurat: "",
      tanggalPenerimaan: "",
      sifatSurat: "",
    });
    setSelectedDisposisi([]);
    setFile(null);
    setSavedSurat(null);
    setDisposisiSearch("");
  };

  const submitSuratMasuk = async (payload: {
    tenggatWaktu?: string;
    keteranganTenggat?: string;
  }) => {
    if (!user?.id) {
      showToast("User login tidak ditemukan.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const encodedFile = file ? await readFileAsBase64(file) : "";
      const dispositions = selectedDisposisi.map((receiverId) => ({
        receiver_id: receiverId,
        sender_id: user.id,
        note: payload.keteranganTenggat?.trim() || undefined,
        due_date: payload.tenggatWaktu
          ? toApiDateTime(payload.tenggatWaktu)
          : undefined,
      }));

      await suratMasukService.createWithDisposition({
        letter_prioritie_id: formData.sifatSurat,
        regarding: formData.perihalSurat.trim(),
        receive_date: toApiDateTime(formData.tanggalPenerimaan),
        mail_number: formData.namaSurat.trim(),
        name: formData.namaPengirim.trim(),
        description: formData.keteranganSurat.trim() || undefined,
        address: formData.alamatPengirim.trim(),
        file: encodedFile,
        is_active: true,
        ...(dispositions.length > 0 ? { dispositions } : {}),
      });

      setIsTenggatModalOpen(false);
      showToast("Surat masuk berhasil disimpan!", "success");
      handleReset();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menyimpan surat masuk",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tanggalPenerimaan) {
      showToast("Tanggal penerimaan wajib diisi!", "error");
      return;
    }

    if (!formData.sifatSurat) {
      showToast("Sifat surat wajib dipilih!", "error");
      return;
    }

    if (!file) {
      showToast("File scan wajib diupload!", "error");
      return;
    }

    const fileValidationMessage = validatePersuratanFile(file);
    if (fileValidationMessage) {
      showToast(fileValidationMessage, "error");
      return;
    }

    if (selectedDisposisi.length === 0) {
      showToast("Wajib memilih minimal satu tujuan disposisi.", "error");
      return;
    }

    const disposisiKepada = disposisiUsers
      .filter((item) => selectedDisposisi.includes(item.id))
      .map((item) => item.nama);

    setSavedSurat({
      ...formData,
      disposisiKepada,
      fileName: file.name,
    });
    setIsTenggatModalOpen(true);
  };

  const handleTenggatSave = (payload: {
    tenggatWaktu?: string;
    keteranganTenggat?: string;
  }) => {
    void submitSuratMasuk(payload);
  };

  const handleTenggatSkip = () => {
    void submitSuratMasuk({});
  };

  const normalizedDisposisiSearch = disposisiSearch.trim().toLowerCase();
  const isDisposisiSearching = normalizedDisposisiSearch.length > 0;
  const filteredDisposisiUsers = useMemo(
    () =>
      disposisiUsers.filter((item) => {
        if (!normalizedDisposisiSearch) return true;
        return (
          item.nama.toLowerCase().includes(normalizedDisposisiSearch) ||
          item.divisi.toLowerCase().includes(normalizedDisposisiSearch)
        );
      }),
    [disposisiUsers, normalizedDisposisiSearch],
  );
  const selectedDisposisiUsers = useMemo(
    () =>
      disposisiUsers
        .filter((item) => selectedDisposisi.includes(item.id))
        .map((item) => ({ id: item.id, nama: item.nama, divisi: item.divisi })),
    [disposisiUsers, selectedDisposisi],
  );
  const shouldScrollDisposisi = filteredDisposisiUsers.length > 5;
  const disposisiListClassName = [
    "space-y-3",
    "pr-2",
    "custom-scrollbar",
    shouldScrollDisposisi ? "max-h-72 overflow-y-auto" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Input Surat Masuk"
        subtitle="Form pencatatan dan pendisposisian surat masuk."
        icon={<Inbox />}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label
                  htmlFor="namaPengirim"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama Pengirim <span className="text-red-500">*</span>
                </label>
                <input
                  id="namaPengirim"
                  type="text"
                  name="namaPengirim"
                  value={formData.namaPengirim}
                  onChange={handleChange}
                  className="input"
                  placeholder="Contoh: PT Amanah Sejahtera"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="tanggalPenerimaan"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tanggal Penerimaan <span className="text-red-500">*</span>
                </label>
                <DatePickerInput
                  value={formData.tanggalPenerimaan}
                  onChange={(nextValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      tanggalPenerimaan: nextValue,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="alamatPengirim"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Alamat Pengirim <span className="text-red-500">*</span>
              </label>
              <textarea
                id="alamatPengirim"
                name="alamatPengirim"
                value={formData.alamatPengirim}
                onChange={handleChange}
                rows={2}
                className="textarea resize-none"
                placeholder="Alamat lengkap instansi/pengirim..."
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label
                  htmlFor="namaSurat"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama/Nomor Surat <span className="text-red-500">*</span>
                </label>
                <input
                  id="namaSurat"
                  type="text"
                  name="namaSurat"
                  value={formData.namaSurat}
                  onChange={handleChange}
                  className="input"
                  placeholder="Contoh: 001/INV/2023"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="sifatSurat"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sifat Surat <span className="text-red-500">*</span>
                </label>
                <select
                  id="sifatSurat"
                  name="sifatSurat"
                  value={formData.sifatSurat}
                  onChange={handleChange}
                  className="select"
                  disabled={isMasterLoading || letterPriorities.length === 0}
                  required
                >
                  <option value="">Pilih Sifat Surat</option>
                  {letterPriorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label
                  htmlFor="keteranganSurat"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Keterangan Surat <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="keteranganSurat"
                  name="keteranganSurat"
                  value={formData.keteranganSurat}
                  onChange={handleChange}
                  rows={3}
                  className="textarea resize-none"
                  placeholder="Tambahkan keterangan utama untuk surat ini..."
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="perihalSurat"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Perihal Surat <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="perihalSurat"
                  name="perihalSurat"
                  value={formData.perihalSurat}
                  onChange={handleChange}
                  rows={3}
                  className="textarea resize-none"
                  placeholder="Ringkasan perihal atau isi surat..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload File <span className="text-red-500">*</span>
              </label>
              <div
                className={[
                  "file-upload",
                  "flex flex-col items-center justify-center",
                  dragOver ? "dragover" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                  <UploadCloud className="w-8 h-8" />
                </div>
                {file ? (
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      <span className="text-primary-600 font-bold">
                        Klik untuk upload
                      </span>{" "}
                      atau drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      PDF, DOC, Gambar (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Disposisi Kepada <span className="text-red-500">*</span>
              </label>
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={disposisiSearch}
                  onChange={(event) => setDisposisiSearch(event.target.value)}
                  className="input input-with-icon w-full"
                  placeholder="Cari nama atau divisi..."
                />
              </div>
              {isDisposisiSearching && (
                <div className={disposisiListClassName}>
                  {isMasterLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                      Memuat user...
                    </div>
                  ) : filteredDisposisiUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                      Tidak ada user yang sesuai
                    </div>
                  ) : (
                    filteredDisposisiUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleDisposisiToggle(user.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3
                                ${
                                  selectedDisposisi.includes(user.id)
                                    ? "border-primary-500 bg-primary-50 shadow-sm"
                                    : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                                }
                             `}
                      >
                        <div onClick={(event) => event.stopPropagation()}>
                          <UiverseCheckbox
                            checked={selectedDisposisi.includes(user.id)}
                            onCheckedChange={() =>
                              handleDisposisiToggle(user.id)
                            }
                            ariaLabel={`Pilih disposisi ${user.nama}`}
                            size={20}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700">
                            {user.nama}
                          </p>
                          <p className="text-xs text-gray-500">{user.divisi}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {selectedDisposisiUsers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedDisposisiUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleDisposisiToggle(user.id)}
                      className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:border-[#157ec3] hover:bg-[rgba(21,126,195,0.04)] hover:shadow-[0_0_0_3px_rgba(21,126,195,0.08)]"
                    >
                      <span className="max-w-[180px] truncate">
                        {user.nama}
                      </span>
                      <X
                        className="h-3.5 w-3.5 text-red-500 transition group-hover:text-red-600"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
              {selectedDisposisi.length === 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Wajib memilih minimal satu tujuan disposisi.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                isMasterLoading ||
                selectedDisposisi.length === 0 ||
                letterPriorities.length === 0
              }
              className="btn btn-primary"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Simpan Surat Masuk
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <TenggatWaktuModal
        isOpen={isTenggatModalOpen}
        onSave={handleTenggatSave}
        onSkip={handleTenggatSkip}
        disposisi={savedSurat?.disposisiKepada ?? []}
        title="Tenggat Waktu & Catatan Disposisi"
        subtitle="Opsional — dapat dilewati"
        noteLabel="Catatan Disposisi"
        notePlaceholder="Tambahkan catatan atau instruksi untuk penerima disposisi..."
      />
    </div>
  );
}
