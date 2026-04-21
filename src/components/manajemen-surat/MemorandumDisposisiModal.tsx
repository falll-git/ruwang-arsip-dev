"use client";

import type { CSSProperties } from "react";
import { ArrowRight, FileText, Search, Send, UserRound, X } from "lucide-react";
import type { Memorandum, SuratUser } from "@/lib/data";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { formatDate, formatDateTime } from "@/lib/utils/date";

interface MemorandumDisposisiModalProps {
  memorandum: Memorandum | null;
  isOpen: boolean;
  users: SuratUser[];
  selectedUserId: string;
  userSearch: string;
  dueDate: string;
  catatan: string;
  isSubmitting: boolean;
  onChangeSelectedUser: (value: string) => void;
  onChangeUserSearch: (value: string) => void;
  onChangeDueDate: (value: string) => void;
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
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          readOnly
          rows={3}
          className="textarea resize-none !cursor-default !border-gray-200 !bg-white !text-gray-700"
        />
      ) : (
        <input
          value={value}
          readOnly
          className="input !cursor-default !border-gray-200 !bg-white !text-gray-700"
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

export default function MemorandumDisposisiModal({
  memorandum,
  isOpen,
  users,
  selectedUserId,
  userSearch,
  dueDate,
  catatan,
  isSubmitting,
  onChangeSelectedUser,
  onChangeUserSearch,
  onChangeDueDate,
  onChangeCatatan,
  onClose,
  onSubmit,
}: MemorandumDisposisiModalProps) {
  if (!memorandum || !isOpen) return null;

  const historyItems = [...memorandum.disposisi_history].sort((left, right) => {
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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Redisposisi Memorandum
            </h2>
            <p className="mt-1 text-sm text-gray-500">{memorandum.noMemo}</p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" title="Tutup">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
            <ReadonlyField label="No Memo" value={memorandum.noMemo} />
            <ReadonlyField
              label="Tanggal Memo"
              value={formatDate(memorandum.tanggal)}
            />
            <ReadonlyField label="Divisi Pengirim" value={memorandum.divisiPengirim} />
            <ReadonlyField label="Pembuat Memo" value={memorandum.pembuatMemo} />
            <ReadonlyField
              label="Perihal Memo"
              value={memorandum.perihal}
              className="md:col-span-2"
              multiline
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tujuan Redisposisi <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                  <input
                    value={userSearch}
                    onChange={(event) => onChangeUserSearch(event.target.value)}
                    className="input input-with-icon"
                    placeholder="Cari user tujuan redisposisi..."
                  />
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                            className={`w-full border-b border-gray-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0 ${
                              isSelected
                                ? "bg-blue-50 font-semibold text-blue-700"
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
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status Disposisi
              </label>
              <div className="flex min-h-[46px] items-center">
                <HistoryBadge
                  isRedisposisi={memorandum.disposisi_history.length > 1}
                />
              </div>
              {selectedUser ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeSelectedUser("")}
                    className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition hover:border-[#157ec3] hover:bg-[rgba(21,126,195,0.04)] hover:shadow-[0_0_0_3px_rgba(21,126,195,0.08)]"
                  >
                    <span className="max-w-[200px] truncate">
                      {selectedUser.nama}
                    </span>
                    <X
                      className="h-3.5 w-3.5 text-red-500 transition group-hover:text-red-600"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tenggat Redisposisi
              </label>
              <DatePickerInput
                value={dueDate}
                onChange={onChangeDueDate}
                placeholder="Pilih tanggal..."
              />
              <p className="mt-2 text-xs text-gray-500">
                Kosongkan jika redisposisi tidak memiliki tenggat waktu baru.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Catatan Redisposisi
              </label>
              <textarea
                value={catatan}
                onChange={(event) => onChangeCatatan(event.target.value)}
                rows={4}
                className="textarea resize-none"
                placeholder="Tambahkan catatan redisposisi..."
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-gray-800">
                  Riwayat Redisposisi
                </h3>
              </div>

              {historyItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                  Belum ada riwayat redisposisi
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
                              className="h-4 w-4 shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.ke_user_nama}</span>
                          </div>
                          {item.catatan ? (
                            <p className="mt-2 text-sm text-gray-600">
                              {item.catatan}
                            </p>
                          ) : null}
                          {item.due_date ? (
                            <p className="mt-2 text-xs font-medium text-gray-500">
                              Tenggat: {formatDate(item.due_date)}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
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

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 p-6 sm:flex-row sm:justify-end">
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
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Kirim Redisposisi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
