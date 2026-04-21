"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  FileText,
  LoaderCircle,
  Printer,
  Search,
  SearchX,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import { type Memorandum, type SuratKeluar, type SuratMasuk } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/components/ui/AppToastProvider";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import { formatDate, parseDateString } from "@/lib/utils/date";
import { detectDocumentFileType, isValidFileUrl } from "@/lib/utils/file";
import { printDocument } from "@/lib/utils/printDocument";
import DocumentViewButton from "@/components/manajemen-surat/DocumentViewButton";
import { memorandumService } from "@/services/memorandum.service";
import { suratKeluarService } from "@/services/surat-keluar.service";
import { suratMasukService } from "@/services/surat-masuk.service";
import { userService } from "@/services/user.service";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type DocumentKind = "surat-masuk" | "surat-keluar" | "memorandum";

type SuratMasukView = SuratMasuk & { fileUrl?: string };
type SuratKeluarView = SuratKeluar & { fileUrl?: string };
type MemorandumView = Memorandum & { fileUrl?: string };

type PrintableRecord =
  | {
      id: string;
      kind: "surat-masuk";
      sortDate: string;
      code: string;
      subject: string;
      primaryText: string;
      secondaryText: string;
      searchText: string;
      fileName: string;
      fileUrl?: string;
      record: SuratMasukView;
    }
  | {
      id: string;
      kind: "surat-keluar";
      sortDate: string;
      code: string;
      subject: string;
      primaryText: string;
      secondaryText: string;
      searchText: string;
      fileName: string;
      fileUrl?: string;
      record: SuratKeluarView;
    }
  | {
      id: string;
      kind: "memorandum";
      sortDate: string;
      code: string;
      subject: string;
      primaryText: string;
      secondaryText: string;
      searchText: string;
      fileName: string;
      fileUrl?: string;
      record: MemorandumView;
    };
const SORT_OPTIONS: Array<{
  value: "tanggal-desc" | "tanggal-asc";
  label: string;
}> = [
  { value: "tanggal-desc", label: "Terbaru (Paling Baru)" },
  { value: "tanggal-asc", label: "Terlama (Paling Lama)" },
];

function normalizePersonName(value: string) {
  const normalized = value.trim();
  if (!normalized) return "-";
  return normalized
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

function getDateValue(value: string) {
  return (parseDateString(value) ?? new Date(0)).getTime();
}

function sortRecords(
  records: PrintableRecord[],
  sortValue: "tanggal-desc" | "tanggal-asc",
) {
  return [...records].sort((left, right) => {
    if (sortValue === "tanggal-asc") {
      return getDateValue(left.sortDate) - getDateValue(right.sortDate);
    }

    return getDateValue(right.sortDate) - getDateValue(left.sortDate);
  });
}

function getSearchPlaceholder(activeKind: DocumentKind) {
  if (activeKind === "surat-masuk") {
    return "Cari pengirim, nomor surat, perihal...";
  }

  if (activeKind === "surat-keluar") {
    return "Cari penerima, alamat, atau nomor surat...";
  }

  if (activeKind === "memorandum") {
    return "Cari no memo, perihal, pembuat...";
  }

  return "Cari no memo, perihal, divisi, pembuat...";
}

function formatDocumentFileName(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : "Belum tersedia";
}

function MiniPdfPreview({
  fileUrl,
  fileName,
}: {
  fileUrl?: string;
  fileName: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pageWidth, setPageWidth] = useState(520);
  const [pageCount, setPageCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const fileType = detectDocumentFileType(fileUrl, fileName);

  useEffect(() => {
    if (!isValidFileUrl(fileUrl)) return;

    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setPageWidth(Math.max(280, Math.floor(element.clientWidth)));
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, [fileUrl]);

  useEffect(() => {
    setPageCount(0);
    setHasError(false);
  }, [fileUrl]);

  if (!isValidFileUrl(fileUrl)) {
    return (
      <div className="flex min-h-[720px] items-center justify-center rounded-[24px] bg-[#f4f6fb] px-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <FileText className="h-7 w-7 text-gray-400" aria-hidden="true" />
          </div>
          <p className="text-base font-semibold text-gray-900">
            File dokumen belum tersedia
          </p>
        </div>
      </div>
    );
  }

  if (fileType === "image") {
    return (
      <div className="rounded-[24px] bg-[#f4f6fb] p-4">
        <div className="max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-[20px] bg-[#eef2f7] p-4">
          <div className="mx-auto w-full max-w-[560px] rounded-[20px] bg-white p-3 shadow-sm ring-1 ring-gray-200">
            <img
              src={fileUrl}
              alt={formatDocumentFileName(fileName)}
              className="h-auto w-full rounded-[16px] object-contain"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] bg-[#f4f6fb] p-4">
      <div className="max-h-[78vh] overflow-y-auto overflow-x-hidden rounded-[20px] bg-[#eef2f7] p-4">
        <div ref={containerRef} className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
          <Document
            file={fileUrl}
            loading={
              <div className="flex min-h-[720px] items-center justify-center rounded-[20px] bg-white shadow-sm ring-1 ring-gray-200">
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary-600" />
                  <p className="text-sm font-medium">Memuat preview dokumen...</p>
                </div>
              </div>
            }
            onLoadSuccess={({ numPages }: { numPages: number }) => {
              setPageCount(numPages);
              setHasError(false);
            }}
            onLoadError={() => {
              setHasError(true);
            }}
            error={
              <div className="flex min-h-[720px] items-center justify-center rounded-[20px] bg-white px-6 text-center shadow-sm ring-1 ring-gray-200">
                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <FileText className="h-7 w-7 text-gray-400" aria-hidden="true" />
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    Preview dokumen belum bisa ditampilkan
                  </p>
                </div>
              </div>
            }
          >
            {hasError
              ? null
              : Array.from({ length: pageCount || 1 }, (_, index) => (
                  <div
                    key={`${fileName}-page-${index + 1}`}
                    className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-gray-200"
                  >
                    <Page
                      pageNumber={index + 1}
                      width={pageWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div className="flex min-h-[720px] items-center justify-center">
                          <LoaderCircle className="h-7 w-7 animate-spin text-primary-600" />
                        </div>
                      }
                    />
                  </div>
                ))}
          </Document>
        </div>
      </div>
    </div>
  );
}

export default function CetakDokumenClient() {
  const { openPreview } = useDocumentPreviewContext();
  const { showToast } = useAppToast();
  const [activeKind, setActiveKind] = useState<DocumentKind>("surat-masuk");
  const [sortValue, setSortValue] = useState<"tanggal-desc" | "tanggal-asc">(
    "tanggal-desc",
  );
  const [searchValue, setSearchValue] = useState("");
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suratMasukData, setSuratMasukData] = useState<SuratMasukView[]>([]);
  const [suratKeluarData, setSuratKeluarData] = useState<SuratKeluarView[]>([]);
  const [memorandumData, setMemorandumData] = useState<MemorandumView[]>([]);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);

      try {
        const [suratMasuk, suratKeluar, memorandums, users] = await Promise.all(
          [
            suratMasukService.getAll(),
            suratKeluarService.getAll(),
            memorandumService.getAll(),
            userService.getAll(),
          ],
        );

        if (ignore) return;

        const userNameById = new Map(
          users.map((user) => [
            user.id,
            user.role_name ? `${user.name} ${user.role_name}` : user.name,
          ]),
        );
        const resolveUserName = (value: string) =>
          userNameById.get(value) ?? normalizePersonName(value);

        setSuratMasukData(
          suratMasuk.map((record) => ({
            ...record,
            disposisiKepada: record.disposisiKepada.map(resolveUserName),
            fileUrl: record.fileUrl,
          })),
        );
        setSuratKeluarData(
          suratKeluar.map((record) => ({
            ...record,
            fileUrl: record.fileUrl,
          })),
        );
        setMemorandumData(
          memorandums.map((record) => ({
            ...record,
            pembuatMemo: resolveUserName(record.pembuatMemo),
            penerima:
              record.penerimaTipe === "perorangan"
                ? record.penerima.map(resolveUserName)
                : record.penerima,
            fileUrl: record.fileUrl,
          })),
        );
      } catch (error) {
        if (!ignore) {
          showToast(
            error instanceof Error
              ? error.message
              : "Gagal memuat dokumen persuratan",
            "error",
          );
          setSuratMasukData([]);
          setSuratKeluarData([]);
          setMemorandumData([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, [showToast]);

  const suratMasukRecords = useMemo<PrintableRecord[]>(
    () =>
      suratMasukData.map((record) => {
        const normalizedRecord: SuratMasukView = {
          ...record,
          disposisiKepada: record.disposisiKepada.map((value) =>
            normalizePersonName(value),
          ),
          fileUrl: record.fileUrl,
        };

        return {
          id: `surat-masuk-${record.id}`,
          kind: "surat-masuk",
          sortDate: normalizedRecord.tanggalTerima,
          code: normalizedRecord.namaSurat,
          subject: normalizedRecord.perihal,
          primaryText: normalizedRecord.pengirim,
          secondaryText: normalizedRecord.sifat,
          searchText: normalizeKeyword(
            [
              normalizedRecord.namaSurat,
              normalizedRecord.pengirim,
              normalizedRecord.alamatPengirim,
              normalizedRecord.perihal,
              normalizedRecord.keterangan ?? "",
              normalizedRecord.keteranganTenggat ?? "",
              normalizedRecord.sifat,
              normalizedRecord.statusDisposisi,
              normalizedRecord.disposisiKepada.join(" "),
            ].join(" "),
          ),
          fileName: normalizedRecord.fileName,
          fileUrl: normalizedRecord.fileUrl,
          record: normalizedRecord,
        };
      }),
    [suratMasukData],
  );

  const suratKeluarRecords = useMemo<PrintableRecord[]>(
    () =>
      suratKeluarData.map((record) => {
        const normalizedRecord: SuratKeluarView = {
          ...record,
          fileUrl: record.fileUrl,
        };

        return {
          id: `surat-keluar-${record.id}`,
          kind: "surat-keluar",
          sortDate: normalizedRecord.tanggalKirim,
          code: normalizedRecord.namaSurat,
          subject: normalizedRecord.penerima,
          primaryText: normalizedRecord.alamatPenerima,
          secondaryText: `${normalizedRecord.media} • ${normalizedRecord.statusLabel}`,
          searchText: normalizeKeyword(
            [
              normalizedRecord.namaSurat,
              normalizedRecord.penerima,
              normalizedRecord.alamatPenerima,
              normalizedRecord.media,
              normalizedRecord.sifat,
              normalizedRecord.statusLabel,
            ].join(" "),
          ),
          fileName: normalizedRecord.fileName,
          fileUrl: normalizedRecord.fileUrl,
          record: normalizedRecord,
        };
      }),
    [suratKeluarData],
  );

  const memorandumRecords = useMemo<PrintableRecord[]>(
    () =>
      memorandumData.map((record) => {
        const normalizedRecord: MemorandumView = {
          ...record,
          pembuatMemo: normalizePersonName(record.pembuatMemo),
          penerima:
            record.penerimaTipe === "perorangan"
              ? record.penerima.map((value) => normalizePersonName(value))
              : record.penerima,
          fileUrl: record.fileUrl,
        };

        return {
          id: `memorandum-${record.id}`,
          kind: "memorandum",
          sortDate: normalizedRecord.tanggal,
          code: normalizedRecord.noMemo,
          subject: normalizedRecord.perihal,
          primaryText: normalizedRecord.divisiPengirim,
          secondaryText: normalizedRecord.pembuatMemo,
          searchText: normalizeKeyword(
            [
              normalizedRecord.noMemo,
              normalizedRecord.perihal,
              normalizedRecord.divisiPengirim,
              normalizedRecord.pembuatMemo,
              normalizedRecord.keterangan,
              normalizedRecord.keteranganTenggat ?? "",
              normalizedRecord.penerima.join(" "),
            ].join(" "),
          ),
          fileName: normalizedRecord.fileName,
          fileUrl: normalizedRecord.fileUrl,
          record: normalizedRecord,
        };
      }),
    [memorandumData],
  );

  const baseRecords = useMemo(() => {
    if (activeKind === "surat-masuk") {
      return suratMasukRecords;
    }

    if (activeKind === "surat-keluar") {
      return suratKeluarRecords;
    }

    return memorandumRecords;
  }, [activeKind, memorandumRecords, suratKeluarRecords, suratMasukRecords]);

  const normalizedSearchValue = normalizeKeyword(searchValue);

  const filteredRecords = useMemo(
    () =>
      sortRecords(
        baseRecords.filter((record) =>
          record.searchText.includes(normalizedSearchValue),
        ),
        sortValue,
      ),
    [baseRecords, normalizedSearchValue, sortValue],
  );

  const activeSelectedRecordId =
    filteredRecords.length === 0
      ? null
      : selectedRecordId &&
          filteredRecords.some((record) => record.id === selectedRecordId)
        ? selectedRecordId
        : filteredRecords[0].id;

  const selectedRecord = filteredRecords.find(
    (record) => record.id === activeSelectedRecordId,
  );

  const handleOpenPreview = () => {
    if (!selectedRecord) {
      showToast("Pilih dokumen terlebih dahulu.", "warning");
      return;
    }

    if (!isValidFileUrl(selectedRecord.fileUrl)) {
      showToast("File dokumen belum tersedia.", "warning");
      return;
    }

    openPreview(
      selectedRecord.fileUrl,
      formatDocumentFileName(selectedRecord.fileName),
    );
  };

  const handlePrint = () => {
    if (!selectedRecord) {
      showToast("Pilih dokumen yang ingin dicetak.", "warning");
      return;
    }

    if (!isValidFileUrl(selectedRecord.fileUrl)) {
      showToast("File dokumen belum tersedia.", "warning");
      return;
    }

    const printStarted = printDocument(selectedRecord.fileUrl);

    if (!printStarted) {
      showToast(
        "Popup browser terblokir. Izinkan popup untuk mencetak.",
        "error",
      );
      return;
    }

    showToast("Dokumen dibuka ke mode cetak.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Cari Dokumen
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="input input-with-icon bg-white"
                placeholder={getSearchPlaceholder(activeKind)}
              />
            </div>
          </div>

          <div className="lg:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Jenis Dokumen
            </label>
            <select
              value={activeKind}
              onChange={(event) =>
                setActiveKind(event.target.value as DocumentKind)
              }
              className="select bg-white"
            >
              <option value="surat-masuk">Surat Masuk</option>
              <option value="surat-keluar">Surat Keluar</option>
              <option value="memorandum">Memorandum</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Urutkan
            </label>
            <div className="relative">
              <ArrowUpDown
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <select
                value={sortValue}
                onChange={(event) =>
                  setSortValue(
                    event.target.value as "tanggal-desc" | "tanggal-asc",
                  )
                }
                className="select input-with-icon bg-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,600px)]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-white px-5 py-4">
            <p className="text-center text-sm font-semibold text-gray-900">
              Menampilkan {filteredRecords.length} dokumen
            </p>
          </div>

          {isLoading ? (
            <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <FileText
                  className="h-8 w-8 text-blue-500"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Memuat dokumen persuratan
              </h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Data surat masuk, surat keluar, dan memorandum sedang diambil
                dari server.
              </p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      No
                    </th>
                    {activeKind === "surat-masuk" ? (
                      <>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Nama Pengirim
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Nomor Surat
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Perihal
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Sifat
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Tgl Penerimaan
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Keterangan Surat
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Catatan Disposisi
                        </th>
                      </>
                    ) : activeKind === "surat-keluar" ? (
                      <>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Nama Penerima
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Nomor Surat
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Alamat Penerima
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Media
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Tgl Pengiriman
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Sifat
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          No Memo
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Perihal
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Divisi
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Pembuat
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Tanggal
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record, index) => {
                    const isSelected = record.id === activeSelectedRecordId;

                    return (
                      <tr
                        key={record.id}
                        tabIndex={0}
                        onClick={() => setSelectedRecordId(record.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedRecordId(record.id);
                          }
                        }}
                        className={`cursor-pointer transition-colors focus-visible:outline-none ${
                          isSelected
                            ? "bg-sky-50/70"
                            : "hover:bg-gray-50/80 focus-visible:bg-gray-50/80"
                        }`}
                      >
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {index + 1}
                        </td>
                        {activeKind === "surat-masuk" ? (
                          <>
                            <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                              {record.primaryText}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700 tabular-nums">
                              {record.code}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700">
                              {record.subject}
                            </td>
                            <td className="px-5 py-4 text-sm font-semibold">
                              <span
                                className={
                                  record.secondaryText === "Rahasia"
                                    ? "text-red-600"
                                    : "text-gray-900"
                                }
                              >
                                {record.secondaryText}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {formatDate(record.sortDate)}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {record.kind === "surat-masuk"
                                ? (record.record.keterangan ?? "-")
                                : "-"}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {record.kind === "surat-masuk"
                                ? (record.record.keteranganTenggat ?? "-")
                                : "-"}
                            </td>
                          </>
                        ) : activeKind === "surat-keluar" ? (
                          record.kind === "surat-keluar" ? (
                            <>
                              <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                                {record.record.penerima}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-700 tabular-nums">
                                {record.code}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-700">
                                {record.record.alamatPenerima}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                                {record.record.media}
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-600">
                                {formatDate(record.sortDate)}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold">
                                <span
                                  className={
                                    record.record.sifat !== "Biasa"
                                      ? "text-red-600"
                                      : "text-gray-900"
                                  }
                                >
                                  {record.record.sifat}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-sm text-gray-600">
                                {record.record.statusLabel}
                              </td>
                            </>
                          ) : null
                        ) : (
                          <>
                            <td className="px-5 py-4 text-sm font-semibold text-primary-600 tabular-nums">
                              {record.code}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700">
                              {record.subject}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-700">
                              {record.primaryText}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                              {record.secondaryText}
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">
                              {formatDate(record.sortDate)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <SearchX className="h-8 w-8 text-gray-400" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Tidak ada dokumen yang sesuai
              </h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                Ubah kata kunci pencarian atau ganti jenis dokumen untuk melihat
                data lain.
              </p>
            </div>
          )}
        </div>

        <div className="self-start rounded-2xl border border-gray-200 bg-white p-4 shadow-sm xl:sticky xl:top-24">
          {selectedRecord ? (
            <div className="space-y-4">
              <MiniPdfPreview
                fileUrl={selectedRecord.fileUrl}
                fileName={selectedRecord.fileName}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DocumentViewButton
                  onClick={handleOpenPreview}
                  className="w-full justify-center"
                  title={
                    isValidFileUrl(selectedRecord.fileUrl)
                      ? "View dokumen"
                      : "File belum tersedia"
                  }
                  disabled={!isValidFileUrl(selectedRecord.fileUrl)}
                />
                <Button
                  onClick={handlePrint}
                  disabled={!isValidFileUrl(selectedRecord.fileUrl)}
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  Cetak Dokumen
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[640px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FileText
                  className="h-8 w-8 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Belum ada dokumen terpilih
              </h3>
              <p className="mt-1 max-w-sm text-sm text-gray-500">
                Pilih salah satu dokumen pada tabel untuk melihat detail,
                preview, lalu cetak file.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
