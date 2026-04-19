"use client";

import { useCallback, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { dummyUploadSLIK } from "@/lib/data";
import type { UploadSLIK } from "@/lib/types/modul3";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { todayIsoDate } from "@/lib/utils/date";
import { formatInformasiDebiturDate } from "@/lib/utils/informasi-debitur";
import { createSafeId } from "@/lib/utils/random";

const PILL_BASE_CLASS =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";

function getUploadStatusPillClass(status: UploadSLIK["status"]) {
  switch (status) {
    case "Selesai":
      return `${PILL_BASE_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700`;
    case "Pending":
      return `${PILL_BASE_CLASS} border-amber-200 bg-amber-50 text-amber-700`;
    case "Diproses":
    default:
      return `${PILL_BASE_CLASS} border-gray-200 bg-gray-100 text-gray-700`;
  }
}

export default function UploadSLIKPage() {
  const [data, setData] = useState<UploadSLIK[]>([...dummyUploadSLIK]);
  const [isLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingUploadItem, setPendingUploadItem] =
    useState<UploadSLIK | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { showToast } = useAppToast();

  const uploadSlikFile = useCallback(async (file: File): Promise<UploadSLIK> => {
    return {
      id: `SLIK-${createSafeId("slik")}`,
      fileName: file.name,
      uploadDate: todayIsoDate(),
      uploadBy: "SYSTEM",
      status: "Pending",
      totalRecord: 0,
    };
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setPendingUploadItem(null);

    try {
      const uploadedItem = await uploadSlikFile(file);
      setPendingUploadItem(uploadedItem);
      requestAnimationFrame(() => {
        setUploadProgress(100);
      });
    } catch {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      showToast("Upload file gagal diproses.", "error");
    }
  };

  const handleUploadComplete = () => {
    if (uploadProgress !== 100 || pendingUploadItem === null) {
      return;
    }

    setData((current) => [pendingUploadItem, ...current]);
    setPendingUploadItem(null);
    setIsUploading(false);
    setUploadProgress(0);
    setSelectedFile(null);
    showToast("File berhasil diupload!", "success");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setSelectedFile(file);
        void handleUpload(file);
      } else {
        showToast("Hanya file Excel (.xlsx/.xls) yang diperbolehkan", "error");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        setSelectedFile(file);
        void handleUpload(file);
      } else {
        showToast("Hanya file Excel (.xlsx/.xls) yang diperbolehkan", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Upload Data SLIK"
        subtitle="Upload file data SLIK untuk update informasi debitur"
        icon={<UploadCloud />}
      />

      <div
        className={`file-upload ${dragActive ? "dragover" : ""} ${isUploading ? "pointer-events-none opacity-90" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() =>
          !isUploading &&
          document.getElementById("upload-slik-file-input")?.click()
        }
      >
        <input
          id="upload-slik-file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <UploadCloud
            className={`w-12 h-12 mb-3 ${isUploading ? "text-[#157ec3] animate-pulse" : "text-[#157ec3]"}`}
            aria-hidden="true"
          />

          {isUploading ? (
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Uploading{selectedFile ? `: ${selectedFile.name}` : "..."}
              </p>
              <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#157ec3] h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                  onTransitionEnd={handleUploadComplete}
                />
              </div>
              <p className="text-xs text-gray-500 tabular-nums">
                {uploadProgress}%
              </p>
            </div>
          ) : selectedFile ? (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Klik untuk ganti file
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Klik atau drag & drop file Excel di sini
              </p>
              <p className="text-xs text-gray-500 mt-1">
                XLSX, XLS (Maks. 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Riwayat Upload</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                File Name
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                Tanggal Upload
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                Upload By
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                Total Record
              </th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet
                      className="w-5 h-5 text-green-600"
                      aria-hidden="true"
                    />
                    <span className="font-medium text-gray-900">
                      {item.fileName}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {formatInformasiDebiturDate(item.uploadDate)}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {item.uploadBy}
                </td>
                <td className="px-5 py-4 text-sm text-gray-900 text-right font-medium">
                  {item.totalRecord}
                </td>
                <td className="px-5 py-4 text-center">
                  <span className={getUploadStatusPillClass(item.status)}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
