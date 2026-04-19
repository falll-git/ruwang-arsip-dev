"use client";

import type { CSSProperties } from "react";
import { ArrowRight, FileText, Search, Send, UserRound, X } from "lucide-react";
import type { SuratMasuk, SuratUser } from "@/lib/data";
import { formatDate, formatDateTime } from "@/lib/utils/date";

interface SuratMasukDisposisiModalProps {
  surat: SuratMasuk | null;
  isOpen: boolean;
  users: SuratUser[];
  selectedUserId: string;
  userSearch: string;
  catatan: string;
  isSubmitting: boolean;
  onChangeSelectedUser: (value: string) => void;
  onChangeUserSearch: (value: string) => void;
  onChangeCatatan: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}



function ReadonlyField({
  label,
  value,
  className = "",
  multiline = false,
}: {
  label: string;
  value: string;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          readOnly
          rows={3}
          className="textarea resize-none !cursor-default !bg-gray-50 !text-gray-700"
        />
      ) : (
        <input
          value={value}
          readOnly
          className="input !cursor-default !bg-gray-50 !text-gray-700"
        />
      )}
    </div>
  );
}

function HistoryBadge({ isRedisposisi }: { isRedisposisi: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isRedisposisi
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      {isRedisposisi ? "Disposisi Ulang" : "Diteruskan"}
    </span>
  );
}

export default function SuratMasukDisposisiModal({
  surat,
  isOpen,
  users,
  selectedUserId,
  userSearch,
  catatan,
  isSubmitting,
  onChangeSelectedUser,
  onChangeUserSearch,
  onChangeCatatan,
  onClose,
  onSubmit,
}: SuratMasukDisposisiModalProps) {
  if (!surat || !isOpen) return null;

  const historyItems = [...surat.disposisi_history].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    const normalizedLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const normalizedRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return normalizedRight - normalizedLeft;
  });
  const normalizedUserSearch = userSearch.trim().toLowerCase();
  const filteredUsers = users.filter((item) =>
    item.nama.toLowerCase().includes(normalizedUserSearch),
  );
  const selectedUser = users.find((item) => item.id === selectedUserId) ?? null;

  return (
    <div
      data-dashboard-overlay="true"
      className="fixed inset-0 p-4"
      style={{
        background: "rgba(0, 0, 0, 0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Disposisi Surat</h2>
            <p className="text-sm text-gray-500 mt-1">{surat.namaSurat}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" title="Tutup">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadonlyField label="Nomor Surat" value={surat.namaSurat} />
            <ReadonlyField
              label="Tanggal Surat"
              value={formatDate(surat.tanggalTerima)}
            />
            <ReadonlyField label="Asal Surat" value={surat.pengirim} />
            <ReadonlyField
              label="Perihal Surat"
              value={surat.perihal}
              className="md:col-span-2"
              multiline
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tujuan Disposisi <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    value={userSearch}
                    onChange={(event) => onChangeUserSearch(event.target.value)}
                    className="input input-with-icon"
                    placeholder="Cari nama user tujuan disposisi..."
                  />
                </div>

                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      User tidak ditemukan.
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto">
                      {filteredUsers.map((item) => {
                        const isSelected = item.id === selectedUserId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChangeSelectedUser(item.id)}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-gray-100 last:border-b-0 ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {item.nama}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Disposisi
              </label>
              <div className="min-h-[46px] flex items-center">
                <HistoryBadge
                  isRedisposisi={surat.disposisi_history.length > 1}
                />
              </div>
              {selectedUser ? (
                <p className="mt-2 text-xs text-gray-500">
                  Tujuan terpilih:{" "}
                  <span className="font-semibold text-gray-700">
                    {selectedUser.nama}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan / Instruksi
              </label>
              <textarea
                value={catatan}
                onChange={(event) => onChangeCatatan(event.target.value)}
                rows={4}
                className="textarea resize-none"
                placeholder="Tambahkan catatan atau instruksi disposisi..."
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Riwayat Disposisi
                </h3>
              </div>

              {historyItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                  Belum ada riwayat disposisi
                </div>
              ) : (
                <div className="space-y-3">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                            <span className="truncate">{item.dari_user_nama}</span>
                            <ArrowRight
                              className="w-4 h-4 text-gray-400 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.ke_user_nama}</span>
                          </div>
                          {item.catatan ? (
                            <p className="mt-2 text-sm text-gray-600">
                              {item.catatan}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <UserRound className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{formatDateTime(item.created_at)}</span>
                          </div>
                        </div>
                        <HistoryBadge isRedisposisi={item.is_disposisi_ulang} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
          <button onClick={onClose} className="btn btn-outline">
            Batal
          </button>
          <button
            onClick={onSubmit}
            disabled={!selectedUserId || isSubmitting}
            className="btn btn-upload"
          >
            {isSubmitting ? (
              <>
                <div
                  className="button-spinner"
                  style={
                    {
                      ["--spinner-size"]: "18px",
                      ["--spinner-border"]: "2px",
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>Kirim Disposisi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
