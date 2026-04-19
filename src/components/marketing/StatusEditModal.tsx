"use client";

import { useState } from "react";
import { X } from "lucide-react";
import StatusBadge from "./StatusBadge";

type StatusValue = "Belum" | "Pending" | "Proses" | "Selesai";

interface StatusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: StatusValue;
  onSave: (newStatus: StatusValue) => void;
  title?: string;
}

export default function StatusEditModal({
  isOpen,
  onClose,
  currentStatus,
  onSave,
  title = "Ubah Status",
}: StatusEditModalProps) {
  if (!isOpen) return null;

  return (
    <StatusEditModalContent
      onClose={onClose}
      currentStatus={currentStatus}
      onSave={onSave}
      title={title}
    />
  );
}

function StatusEditModalContent({
  onClose,
  currentStatus,
  onSave,
  title,
}: Omit<StatusEditModalProps, "isOpen">) {
  const [status, setStatus] = useState<StatusValue>(currentStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== currentStatus) onSave(status);
    onClose();
  };

  return (
    <div
      data-dashboard-overlay="true"
      className="fixed inset-0 z-60 flex items-center justify-center animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/70 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusValue)}
              className="select w-full"
            >
              <option value="Belum">Belum</option>
              <option value="Pending">Pending</option>
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
            </select>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
