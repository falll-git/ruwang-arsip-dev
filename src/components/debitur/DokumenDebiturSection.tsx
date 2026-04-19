"use client";

import { FolderOpen, Plus, Trash2, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from "react";

import type { DokumenDebitur } from "@/lib/types/modul3";
import { todayIsoDate } from "@/lib/utils/date";
import {
  formatInformasiDebiturDate,
  getDebiturDocumentPreviewType,
  normalizeDebiturDocumentUrl,
} from "@/lib/utils/informasi-debitur";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import { Button } from "@/components/ui/button";
import DebiturViewButton from "@/components/debitur/DebiturViewButton";
import TambahDokumenModal, {
  type TambahDokumenPayload,
} from "@/components/debitur/TambahDokumenModal";
import DokumenPreviewModal from "@/components/debitur/DokumenPreviewModal";
import { useAppToast } from "@/components/ui/AppToastProvider";

type StandardDocumentItem = {
  id: string;
  namaDokumen: string;
  jenisDokumen: DokumenDebitur["jenisDokumen"];
  aliases: string[];
  fileName?: string;
};

type PreviewSource = {
  fileUrl: string;
  fileType: "pdf" | "image";
};

const STANDARD_DOCUMENTS: StandardDocumentItem[] = [
  {
    id: "ktp-nasabah",
    namaDokumen: "KTP Nasabah",
    jenisDokumen: "KTP",
    aliases: ["ktp nasabah"],
    fileName: "ktp-nasabah.pdf",
  },
  {
    id: "ktp-pasangan",
    namaDokumen: "KTP Pasangan (jika ada)",
    jenisDokumen: "KTP",
    aliases: ["ktp pasangan", "ktp istri", "ktp suami"],
  },
  {
    id: "npwp",
    namaDokumen: "NPWP",
    jenisDokumen: "NPWP",
    aliases: ["npwp"],
    fileName: "npwp.pdf",
  },
  {
    id: "foto-akad",
    namaDokumen: "Foto Akad",
    jenisDokumen: "Foto",
    aliases: ["foto akad"],
  },
  {
    id: "akad-pembiayaan",
    namaDokumen: "Akad Pembiayaan",
    jenisDokumen: "Akad",
    aliases: ["akad pembiayaan"],
    fileName: "akad-pembiayaan.pdf",
  },
  {
    id: "sertifikat-jaminan",
    namaDokumen: "Sertifikat Jaminan",
    jenisDokumen: "Jaminan",
    aliases: ["sertifikat jaminan", "sertifikat", "jaminan"],
    fileName: "sertifikat-jaminan.pdf",
  },
  {
    id: "bpkb",
    namaDokumen: "BPKB (jika kendaraan)",
    jenisDokumen: "BPKB",
    aliases: ["bpkb"],
  },
  {
    id: "slip-gaji",
    namaDokumen: "Slip Gaji / Bukti Penghasilan",
    jenisDokumen: "Penghasilan",
    aliases: ["slip gaji", "bukti penghasilan", "penghasilan"],
  },
  {
    id: "kartu-keluarga",
    namaDokumen: "Kartu Keluarga",
    jenisDokumen: "KK",
    aliases: ["kartu keluarga", "kk"],
    fileName: "kartu-keluarga.pdf",
  },
  {
    id: "pas-foto",
    namaDokumen: "Pas Foto",
    jenisDokumen: "Foto",
    aliases: ["pas foto"],
  },
];

function normalizeValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function inferJenisDokumen(namaDokumen: string): DokumenDebitur["jenisDokumen"] {
  const normalized = normalizeValue(namaDokumen);

  if (normalized.includes("ktp")) return "KTP";
  if (normalized.includes("kartu keluarga") || normalized === "kk") return "KK";
  if (normalized.includes("npwp")) return "NPWP";
  if (normalized.includes("akad")) return "Akad";
  if (normalized.includes("sertifikat") || normalized.includes("jaminan")) {
    return "Jaminan";
  }
  if (normalized.includes("bpkb")) return "BPKB";
  if (
    normalized.includes("slip gaji") ||
    normalized.includes("bukti penghasilan") ||
    normalized.includes("penghasilan")
  ) {
    return "Penghasilan";
  }
  if (normalized.includes("foto")) return "Foto";
  return "Lainnya";
}

function findStandardDocumentMatch(
  document: DokumenDebitur,
  item: StandardDocumentItem,
) {
  const documentName = normalizeValue(document.namaDokumen);
  return item.aliases.some((alias) => documentName.includes(alias));
}

function getStandardDocumentPriority(
  document: DokumenDebitur,
  standard: StandardDocumentItem,
) {
  const normalizedName = normalizeValue(document.namaDokumen);
  const hasExactName = normalizedName === normalizeValue(standard.namaDokumen);
  const hasMappedFile =
    document.filePath.startsWith("blob:") ||
    document.filePath.includes("/contoh-dok/") ||
    Boolean(standard.fileName);
  const uploadTime = Date.parse(document.tanggalUpload) || 0;

  return (
    (hasExactName ? 10_000 : 0) +
    (document.kategori === "AWAL" ? 1_000 : 0) +
    (hasMappedFile ? 100 : 0) +
    uploadTime
  );
}

function getBestStandardDocument(
  documents: DokumenDebitur[],
  standard: StandardDocumentItem,
) {
  return (
    documents
      .filter((document) => findStandardDocumentMatch(document, standard))
      .sort(
        (left, right) =>
          getStandardDocumentPriority(right, standard) -
          getStandardDocumentPriority(left, standard),
      )[0] ?? null
  );
}

function getStandardDocumentSource(
  document: DokumenDebitur | null,
  standard: StandardDocumentItem,
): PreviewSource | null {
  if (!document) return null;

  if (document.filePath.startsWith("blob:")) {
    return {
      fileUrl: normalizeDebiturDocumentUrl(document.filePath),
      fileType: getDebiturDocumentPreviewType(
        document.filePath,
        document.fileType,
      ),
    };
  }

  if (document.filePath.includes("/contoh-dok/")) {
    return {
      fileUrl: normalizeDebiturDocumentUrl(document.filePath),
      fileType: getDebiturDocumentPreviewType(
        document.filePath,
        document.fileType,
      ),
    };
  }

  if (standard.fileName) {
    return {
      fileUrl: `/contoh-dok/${standard.fileName}`,
      fileType: "pdf",
    };
  }

  return null;
}

function findMatchingStandard(document: DokumenDebitur) {
  return (
    STANDARD_DOCUMENTS.find((item) => findStandardDocumentMatch(document, item)) ??
    null
  );
}

function DeleteConfirmDialog({
  isOpen,
  documentName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  documentName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      data-dashboard-overlay="true"
      className="fixed inset-0 z-[76] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Hapus Dokumen</h2>
            <p className="mt-1 text-sm text-gray-500">
              Dokumen yang dihapus tidak bisa dikembalikan otomatis.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Anda yakin ingin menghapus{" "}
            <span className="font-semibold">{documentName}</span>?
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DokumenDebiturSection({
  debiturId,
  initialDocuments,
}: {
  debiturId: string;
  initialDocuments: DokumenDebitur[];
}) {
  const { hasCapability, ensureCapability } = useProtectedAction();
  const { showToast } = useAppToast();
  const canCreateDebiturDocuments = hasCapability(
    "/dashboard/informasi-debitur/marketing/action-plan",
    "create",
  );
  const canDeleteDebiturDocuments = hasCapability(
    "/dashboard/informasi-debitur/marketing/action-plan",
    "delete",
  );
  const [documentsByDebitur, setDocumentsByDebitur] = useState<
    Record<string, DokumenDebitur[]>
  >({});
  const documents = documentsByDebitur[debiturId] ?? initialDocuments;
  const setDocuments = useCallback(
    (updater: SetStateAction<DokumenDebitur[]>) => {
      setDocumentsByDebitur((current) => {
        const currentDocuments = current[debiturId] ?? initialDocuments;
        const nextDocuments =
          typeof updater === "function"
            ? (
                updater as (currentValue: DokumenDebitur[]) => DokumenDebitur[]
              )(currentDocuments)
            : updater;

        return {
          ...current,
          [debiturId]: nextDocuments,
        };
      });
    },
    [debiturId, initialDocuments],
  );
  const [uploadConfig, setUploadConfig] = useState<{
    kategori: "AWAL" | "LAINNYA";
    namaDokumen?: string;
    lockName?: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DokumenDebitur | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{
    namaDokumen: string;
    filePath: string;
    fileType?: "pdf" | "image";
  } | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const standardRows = useMemo(
    () =>
      STANDARD_DOCUMENTS.map((standard) => {
        const matchedDocument = getBestStandardDocument(documents, standard);
        const source = getStandardDocumentSource(matchedDocument, standard);

        return {
          standard,
          document: matchedDocument,
          source,
          exists: Boolean(matchedDocument && source),
        };
      }),
    [documents],
  );

  const additionalDocuments = useMemo(
    () =>
      documents
        .filter((document) => {
          const matchedStandard = findMatchingStandard(document);
          return document.kategori === "LAINNYA" || !matchedStandard;
        })
        .sort(
          (left, right) =>
            (Date.parse(right.tanggalUpload) || 0) -
            (Date.parse(left.tanggalUpload) || 0),
        ),
    [documents],
  );

  const handlePreview = (
    document: DokumenDebitur,
    override?: PreviewSource,
  ) => {
    const fileUrl =
      override?.fileUrl ?? normalizeDebiturDocumentUrl(document.filePath);
    const fileType =
      override?.fileType ??
      getDebiturDocumentPreviewType(document.filePath, document.fileType);

    setPreviewDocument({
      namaDokumen: document.namaDokumen,
      filePath: fileUrl,
      fileType,
    });
  };

  const handleSubmitDocument = ({
    namaDokumen,
    keterangan,
    file,
    kategori,
  }: TambahDokumenPayload) => {
    if (
      !ensureCapability(
        "/dashboard/informasi-debitur/marketing/action-plan",
        "create",
      )
    ) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const fileType =
      extension === "png" ? "png" : extension === "pdf" ? "pdf" : "jpg";
    const filePath = URL.createObjectURL(file);

    objectUrlsRef.current.push(filePath);

    setDocuments((current) => [
      ...current,
      {
        id: `DOC-${Date.now()}`,
        debiturId,
        namaDokumen,
        jenisDokumen: inferJenisDokumen(namaDokumen),
        kategori,
        keterangan,
        tanggalUpload: todayIsoDate(),
        filePath,
        fileType,
      },
    ]);

    showToast("Dokumen berhasil ditambahkan", "success");
    setUploadConfig(null);
  };

  const handleDeleteDocument = (document: DokumenDebitur) => {
    if (
      !ensureCapability(
        "/dashboard/informasi-debitur/marketing/action-plan",
        "delete",
      )
    ) {
      return;
    }

    const matchedStandard = findMatchingStandard(document);

    setDocuments((current) =>
      current.filter((item) => {
        if (matchedStandard && findStandardDocumentMatch(item, matchedStandard)) {
          if (item.filePath.startsWith("blob:")) {
            URL.revokeObjectURL(item.filePath);
            objectUrlsRef.current = objectUrlsRef.current.filter(
              (value) => value !== item.filePath,
            );
          }
          return false;
        }

        if (item.id === document.id) {
          if (item.filePath.startsWith("blob:")) {
            URL.revokeObjectURL(item.filePath);
            objectUrlsRef.current = objectUrlsRef.current.filter(
              (value) => value !== item.filePath,
            );
          }
          return false;
        }

        return true;
      }),
    );

    showToast("Dokumen berhasil dihapus", "success");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Dokumen Awal
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Daftar dokumen standar yang wajib tersedia untuk setiap debitur.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    No
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Nama Dokumen
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Keterangan
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standardRows.map(({ standard, document, source, exists }, index) => (
                  <tr
                    key={standard.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {standard.namaDokumen}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {exists ? document?.keterangan?.trim() || "-" : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          exists
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {exists ? "Ada" : "Belum Ada"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {exists && document && source ? (
                          <>
                            <DebiturViewButton
                              onClick={() => handlePreview(document, source)}
                              title={`View ${standard.namaDokumen}`}
                            />
                            {canDeleteDebiturDocuments ? (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(document)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                                title="Hapus dokumen"
                                aria-label="Hapus dokumen"
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {canCreateDebiturDocuments ? (
                              <Button
                                type="button"
                                variant="upload"
                                onClick={() =>
                                  setUploadConfig({
                                    kategori: "AWAL",
                                    namaDokumen: standard.namaDokumen,
                                    lockName: true,
                                  })
                                }
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Upload
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Dokumen Lainnya
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Dokumen pendukung tambahan di luar daftar standar debitur.
            </p>
          </div>
          {canCreateDebiturDocuments ? (
            <Button
              type="button"
              onClick={() => setUploadConfig({ kategori: "LAINNYA" })}
              variant="upload"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Dokumen
            </Button>
          ) : null}
        </div>

        {additionalDocuments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
            <FolderOpen
              className="mx-auto mb-4 h-10 w-10 text-gray-300"
              aria-hidden="true"
            />
            <h4 className="text-lg font-semibold text-gray-900">
              Belum ada dokumen tambahan
            </h4>
            <p className="mt-2 text-sm text-gray-500">
              Tambahkan dokumen pendukung bila diperlukan untuk monitoring
              debitur.
            </p>
            {canCreateDebiturDocuments ? (
              <div className="mt-5">
                <Button
                  type="button"
                  onClick={() => setUploadConfig({ kategori: "LAINNYA" })}
                  variant="upload"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Tambah Dokumen
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      No
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Nama Dokumen
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Keterangan
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Tgl Upload
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {additionalDocuments.map((document, index) => (
                    <tr
                      key={document.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {document.namaDokumen}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {document.keterangan?.trim() || "-"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatInformasiDebiturDate(document.tanggalUpload)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <DebiturViewButton
                            onClick={() => handlePreview(document)}
                            title={`View ${document.namaDokumen}`}
                          />
                          {canDeleteDebiturDocuments ? (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(document)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                              title="Hapus dokumen"
                              aria-label="Hapus dokumen"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <TambahDokumenModal
        isOpen={uploadConfig !== null}
        onClose={() => setUploadConfig(null)}
        onSubmit={handleSubmitDocument}
        kategori={uploadConfig?.kategori ?? "LAINNYA"}
        presetName={uploadConfig?.namaDokumen}
        lockName={uploadConfig?.lockName}
      />

      <DeleteConfirmDialog
        isOpen={deleteTarget !== null}
        documentName={deleteTarget?.namaDokumen ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeleteDocument(deleteTarget);
        }}
      />

      <DokumenPreviewModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}
