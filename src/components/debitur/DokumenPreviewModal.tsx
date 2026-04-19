"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type PreviewDocument = {
  namaDokumen: string;
  filePath: string;
  fileType?: "pdf" | "image" | "jpg" | "png";
} | null;

export default function DokumenPreviewModal({
  document,
  onClose,
}: {
  document: PreviewDocument;
  onClose: () => void;
}) {
  if (!document) return null;

  const isImage =
    document.fileType === "image" ||
    document.fileType === "jpg" ||
    document.fileType === "png";

  return (
    <div
      data-dashboard-overlay="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {document.namaDokumen}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isImage ? (
            <div className="relative mx-auto h-[70vh] w-full max-w-5xl">
              <Image
                src={document.filePath}
                alt={document.namaDokumen}
                fill
                sizes="100vw"
                className="rounded-lg bg-white object-contain shadow"
                unoptimized
              />
            </div>
          ) : (
            <iframe
              src={document.filePath}
              title={document.namaDokumen}
              className="h-[70vh] w-full rounded-lg bg-white"
            />
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4">
          <Button type="button" asChild>
            <a href={document.filePath} download>
              Download
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
