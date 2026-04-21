"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Search,
  FileText,
  UploadCloud,
  User,
  Send,
  X,
} from "lucide-react";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import UiverseCheckbox from "@/components/ui/UiverseCheckbox";
import TenggatWaktuModal from "@/components/surat/TenggatWaktuModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { readFileAsBase64, validatePersuratanFile } from "@/lib/utils/file";
import { toApiDateTime } from "@/services/api.utils";
import { divisionService } from "@/services/division.service";
import { memorandumService } from "@/services/memorandum.service";
import { userService } from "@/services/user.service";

type DivisionOption = {
  id: string;
  name: string;
};

type ReceiverUserOption = {
  id: string;
  nama: string;
  divisi: string;
};

type MemorandumDraft = {
  noMemo: string;
  perihalMemo: string;
  tanggalMemo: string;
  divisiPengirim: string;
  pembuatMemo: string;
  keteranganMemo: string;
  receiverIds: string[];
  fileName?: string;
};

const INITIAL_FORM_DATA = {
  noMemo: "",
  perihalMemo: "",
  tanggalMemo: "",
  divisiPengirim: "",
  pembuatMemo: "",
  keteranganMemo: "",
};

export default function InputMemorandumPage() {
  const { user } = useAuth();
  const { showToast } = useAppToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [savedMemo, setSavedMemo] = useState<MemorandumDraft | null>(null);
  const [isTenggatModalOpen, setIsTenggatModalOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [divisionOptions, setDivisionOptions] = useState<DivisionOption[]>([]);
  const [receiverUsers, setReceiverUsers] = useState<ReceiverUserOption[]>([]);
  const [isMasterLoading, setIsMasterLoading] = useState(true);

  useEffect(() => {
    if (!user?.name) return;

    setFormData((prev) =>
      prev.pembuatMemo ? prev : { ...prev, pembuatMemo: user.name },
    );
  }, [user?.name]);

  useEffect(() => {
    let ignore = false;

    async function loadMasterData() {
      setIsMasterLoading(true);

      try {
        const [divisions, users] = await Promise.all([
          divisionService.getAll(),
          userService.getAll(),
        ]);

        if (ignore) return;

        setDivisionOptions(
          [...divisions]
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((item) => ({
              id: item.id,
              name: item.name,
            })),
        );
        setReceiverUsers(
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
              : "Gagal memuat master memorandum",
            "error",
          );
        }
      } finally {
        if (!ignore) {
          setIsMasterLoading(false);
        }
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

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      showToast("Pilih minimal 1 penerima memo!", "error");
      return;
    }

    if (
      !formData.noMemo ||
      !formData.perihalMemo ||
      !formData.tanggalMemo ||
      !formData.divisiPengirim ||
      !formData.pembuatMemo ||
      !formData.keteranganMemo
    ) {
      showToast("Lengkapi semua field memorandum!", "error");
      return;
    }

    if (!file) {
      showToast("File memorandum wajib diupload!", "error");
      return;
    }

    const fileValidationMessage = validatePersuratanFile(file);
    if (fileValidationMessage) {
      showToast(fileValidationMessage, "error");
      return;
    }

    setSavedMemo({
      ...formData,
      receiverIds: selectedUsers,
      fileName: file?.name ?? "",
    });
    setIsTenggatModalOpen(true);
  };

  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM_DATA,
      pembuatMemo: user?.name ?? "",
    });
    setSelectedUsers([]);
    setFile(null);
    setUserSearch("");
    setSavedMemo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submitMemorandum = async (payload: {
    tenggatWaktu?: string;
    keteranganTenggat?: string;
  }) => {
    if (!savedMemo) {
      setIsTenggatModalOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const memoDate = toApiDateTime(savedMemo.tanggalMemo);
      const dueDate = payload.tenggatWaktu
        ? toApiDateTime(payload.tenggatWaktu)
        : undefined;
      const encodedFile = file ? await readFileAsBase64(file) : "";

      await memorandumService.create({
        division_id: savedMemo.divisiPengirim,
        regarding: savedMemo.perihalMemo.trim(),
        memo_date: memoDate,
        received_date: memoDate,
        due_date: dueDate,
        memo_number: savedMemo.noMemo.trim(),
        description: savedMemo.keteranganMemo.trim(),
        file: encodedFile,
        status: 0,
        receivers: savedMemo.receiverIds.map((receiverId) => ({
          receiver_id: receiverId,
          due_date: dueDate,
        })),
      });

      showToast("Memorandum berhasil disimpan!", "success");
      setIsTenggatModalOpen(false);
      handleReset();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menyimpan memorandum",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTenggatSave = (payload: {
    tenggatWaktu?: string;
    keteranganTenggat?: string;
  }) => {
    void submitMemorandum(payload);
  };

  const handleTenggatSkip = () => {
    void submitMemorandum({});
  };

  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const isUserSearching = normalizedUserSearch.length > 0;
  const filteredPenerimaUsers = receiverUsers.filter((userOption) => {
    if (!normalizedUserSearch) return true;
    return (
      userOption.nama.toLowerCase().includes(normalizedUserSearch) ||
      userOption.divisi.toLowerCase().includes(normalizedUserSearch)
    );
  });
  const selectedUserItems = receiverUsers
    .filter((userOption) => selectedUsers.includes(userOption.id))
    .map((userOption) => ({ id: userOption.id, nama: userOption.nama }));
  const shouldScrollUsers = filteredPenerimaUsers.length > 5;
  const userListClassName = [
    "space-y-3",
    "pr-2",
    "custom-scrollbar",
    shouldScrollUsers ? "max-h-72 overflow-y-auto" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const isPenerimaTerpilih = selectedUsers.length > 0;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <FeatureHeader
        title="Input Memorandum"
        subtitle="Buat dan distribusikan memorandum internal"
        icon={<FileText />}
      />

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="divisiPengirim"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Divisi Pengirim <span className="text-red-500">*</span>
              </label>
              <select
                id="divisiPengirim"
                name="divisiPengirim"
                value={formData.divisiPengirim}
                onChange={handleChange}
                required
                disabled={isMasterLoading || isLoading}
                className="select"
              >
                <option value="">
                  {isMasterLoading ? "Memuat divisi..." : "Pilih Divisi"}
                </option>
                {divisionOptions.map((divisi) => (
                  <option key={divisi.id} value={divisi.id}>
                    {divisi.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="noMemo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                No Memo <span className="text-red-500">*</span>
              </label>
              <input
                id="noMemo"
                type="text"
                name="noMemo"
                value={formData.noMemo}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="input tabular-nums"
                placeholder="Contoh: MEMO/001/HRD/2026"
              />
            </div>

            <div>
              <label
                htmlFor="tanggalMemo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tanggal Memo <span className="text-red-500">*</span>
              </label>
              <DatePickerInput
                value={formData.tanggalMemo}
                onChange={(nextValue) =>
                  setFormData((prev) => ({
                    ...prev,
                    tanggalMemo: nextValue,
                  }))
                }
              />
            </div>

            <div>
              <label
                htmlFor="pembuatMemo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pembuat Memo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="pembuatMemo"
                  type="text"
                  name="pembuatMemo"
                  value={formData.pembuatMemo}
                  onChange={handleChange}
                  required
                  readOnly
                  disabled={isLoading}
                  className="input input-with-icon !cursor-default !bg-white !text-gray-700"
                  placeholder="Nama pembuat memo"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="perihalMemo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Perihal Memo <span className="text-red-500">*</span>
            </label>
            <input
              id="perihalMemo"
              type="text"
              name="perihalMemo"
              value={formData.perihalMemo}
              onChange={handleChange}
              required
              disabled={isLoading}
              className="input"
              placeholder="Contoh: Evaluasi Kinerja Karyawan"
            />
          </div>

          <div>
            <label
              htmlFor="keteranganMemo"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Keterangan Memo <span className="text-red-500">*</span>
            </label>
            <textarea
              id="keteranganMemo"
              name="keteranganMemo"
              value={formData.keteranganMemo}
              onChange={handleChange}
              required
              disabled={isLoading}
              rows={4}
              className="textarea"
              placeholder="Jelaskan detail memorandum secara lengkap..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                onClick={() => {
                  if (!isLoading) fileInputRef.current?.click();
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isLoading) {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={isLoading}
                />
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                  <UploadCloud className="w-8 h-8" aria-hidden="true" />
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
                Penerima Memo <span className="text-red-500">*</span>
              </label>

              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  className="input input-with-icon w-full"
                  placeholder="Cari nama atau divisi..."
                  disabled={isLoading}
                />
              </div>

              {isUserSearching && (
                <div className={userListClassName}>
                  {isMasterLoading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                      Memuat daftar user...
                    </div>
                  ) : filteredPenerimaUsers.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-sm text-gray-400">
                      Tidak ada user yang sesuai
                    </div>
                  ) : (
                    filteredPenerimaUsers.map((userOption) => (
                      <div
                        key={userOption.id}
                        onClick={() => handleUserToggle(userOption.id)}
                        className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center gap-3
                          ${
                            selectedUsers.includes(userOption.id)
                              ? "border-primary-500 bg-primary-50 shadow-sm"
                              : "border-gray-200 hover:border-primary-200 hover:bg-gray-50"
                          }`}
                      >
                        <div onClick={(event) => event.stopPropagation()}>
                          <UiverseCheckbox
                            checked={selectedUsers.includes(userOption.id)}
                            onCheckedChange={() =>
                              handleUserToggle(userOption.id)
                            }
                            ariaLabel={`Pilih penerima ${userOption.nama}`}
                            size={20}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-700">
                            {userOption.nama}
                          </p>
                          <p className="text-xs text-gray-500">
                            {userOption.divisi}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              {selectedUserItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUserItems.map((userOption) => (
                    <button
                      key={userOption.id}
                      type="button"
                      onClick={() => handleUserToggle(userOption.id)}
                      className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:border-[#157ec3] hover:bg-[rgba(21,126,195,0.04)] hover:shadow-[0_0_0_3px_rgba(21,126,195,0.08)]"
                    >
                      <span className="max-w-[180px] truncate">
                        {userOption.nama}
                      </span>
                      <X
                        className="h-3.5 w-3.5 text-red-500 transition group-hover:text-red-600"
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
              )}
              {!isPenerimaTerpilih && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Wajib memilih minimal satu penerima.
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className="btn btn-outline"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isLoading || !isPenerimaTerpilih}
              className="btn btn-primary"
            >
              {isLoading ? (
                <>
                  <div
                    className="button-spinner"
                    style={
                      {
                        ["--spinner-size"]: "18px",
                        ["--spinner-border"]: "2px",
                      } as React.CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" aria-hidden="true" />
                  <span>Simpan Memorandum</span>
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
        disposisi={selectedUserItems.map((item) => item.nama)}
        title="Tenggat Waktu Memorandum"
        subtitle="Opsional — dapat dilewati"
        showNoteField={false}
      />
    </div>
  );
}
