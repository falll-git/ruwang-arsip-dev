"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  ChevronDown,
  FileUp,
  FileSearch,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppToast } from "@/components/ui/AppToastProvider";
import type { Debitur } from "@/lib/types/modul3";

const BULAN_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const TAHUN_OPTIONS = [2023, 2024, 2025, 2026];

export interface UploadIdebFormPayload {
  debiturId: string;
  bulan: number;
  namaBulan: string;
  tahun: number;
  file: File;
}

function SearchableNasabahField({
  options,
  value,
  onChange,
}: {
  options: Debitur[];
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) ?? null,
    [options, value],
  );

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const filteredOptions = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return options;

    return options.filter((option) => {
      const byName = option.namaNasabah.toLowerCase().includes(keyword);
      const byContract = option.noKontrak.toLowerCase().includes(keyword);
      return byName || byContract;
    });
  }, [options, searchText]);

  const inputValue =
    value && !isOpen && !searchText
      ? `${selectedOption?.namaNasabah ?? ""} - ${selectedOption?.noKontrak ?? ""}`
      : searchText;

  return (
    <div ref={wrapperRef} className="relative">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden="true"
      />
      <input
        type="text"
        className="input input-with-icon pr-18"
        placeholder="Cari nama nasabah atau no kontrak..."
        value={inputValue}
        onChange={(event) => {
          setSearchText(event.target.value);
          if (value) onChange("");
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {(searchText || value) && (
          <button
            type="button"
            onClick={() => {
              setSearchText("");
              onChange("");
              setIsOpen(true);
            }}
            className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-gray-100"
            title="Hapus pilihan"
            aria-label="Hapus pilihan"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </div>

      {isOpen ? (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
          {filteredOptions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">
              Nasabah tidak ditemukan.
            </p>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setSearchText("");
                  setIsOpen(false);
                }}
                className="w-full border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-blue-50/50 last:border-0"
              >
                <p className="font-medium text-gray-900">{option.namaNasabah}</p>
                <p className="mt-1 text-xs font-medium text-gray-700">
                  {option.noKontrak}
                </p>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function UploadIdebForm({
  options,
  onProcessed,
  disabled = false,
}: {
  options: Debitur[];
  onProcessed: (payload: UploadIdebFormPayload) => void;
  disabled?: boolean;
}) {
  const { showToast } = useAppToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedDebiturId, setSelectedDebiturId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number | "">("");
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelection = (file: File | null) => {
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const allowed =
      fileName.endsWith(".txt") ||
      fileName.endsWith(".csv") ||
      fileName.endsWith(".xlsx");

    if (!allowed) {
      showToast("Format file harus .txt, .csv, atau .xlsx", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file maksimal 5MB", "error");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;

    if (
      !selectedDebiturId ||
      selectedMonth === "" ||
      selectedYear === "" ||
      !selectedFile
    ) {
      showToast("Semua field wajib diisi", "error");
      return;
    }

    setIsProcessing(true);
    const selectedMonthLabel =
      BULAN_OPTIONS.find((item) => item.value === selectedMonth)?.label ??
      "";

    onProcessed({
      debiturId: selectedDebiturId,
      bulan: selectedMonth,
      namaBulan: selectedMonthLabel,
      tahun: selectedYear,
      file: selectedFile,
    });

    setIsProcessing(false);
    showToast("Data IDEB berhasil diproses", "success");
  };

  return (
    <div
      className="rounded-xl bg-white p-6"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upload Data Ideb</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Pilih Nasabah
          </label>
          <SearchableNasabahField
            options={options}
            value={selectedDebiturId}
            onChange={(nextValue) => {
              if (disabled) return;
              setSelectedDebiturId(nextValue);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bulan
            </label>
            <select
              value={selectedMonth}
              onChange={(event) =>
                !disabled &&
                setSelectedMonth(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
              className="select"
              disabled={disabled}
            >
              <option value="">Pilih bulan</option>
              {BULAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tahun
            </label>
            <select
              value={selectedYear}
              onChange={(event) =>
                !disabled &&
                setSelectedYear(
                  event.target.value ? Number(event.target.value) : "",
                )
              }
              className="select"
              disabled={disabled}
            >
              <option value="">Pilih tahun</option>
              {TAHUN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Upload File Ideb
          </label>
          <div
            className={`rounded-2xl border border-dashed px-6 py-10 text-center transition-colors ${
              isDragging
                ? "border-[#157ec3] bg-[#157ec3]/6"
                : "border-gray-300 bg-gray-50"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              if (disabled) return;
              event.preventDefault();
              setIsDragging(false);
              handleFileSelection(event.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => {
              if (disabled) return;
              inputRef.current?.click();
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.csv,.xlsx"
              className="hidden"
              disabled={disabled}
              onChange={(event) =>
                handleFileSelection(event.target.files?.[0] ?? null)
              }
            />
            <FileUp
              className="mx-auto mb-3 h-10 w-10 text-[#157ec3]"
              aria-hidden="true"
            />
            <p className="text-sm font-semibold text-gray-900">
              {selectedFile
                ? selectedFile.name
                : "Drag file ke sini atau klik untuk memilih"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Format: .txt, .csv, .xlsx - Maks. 5MB
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="upload"
          className="w-full justify-center"
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <>
              <div
                className="button-spinner"
                style={
                  {
                    ["--spinner-size"]: "16px",
                    ["--spinner-border"]: "2px",
                  } as CSSProperties
                }
                aria-hidden="true"
              />
              Memproses...
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              Upload & Proses
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
