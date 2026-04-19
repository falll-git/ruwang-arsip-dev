"use client";

import type { ReactNode } from "react";

import DetailModal, {
  DetailRow,
  DetailSection,
} from "@/components/marketing/DetailModal";

interface LaporanLegalDetailModalSection {
  title: string;
  rows: Array<{
    label: string;
    value: ReactNode;
  }>;
}

export default function LaporanLegalDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  sections,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  sections: LaporanLegalDetailModalSection[];
}) {
  return (
    <DetailModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        {sections.map((section) => (
          <DetailSection key={section.title} title={section.title}>
            {section.rows.map((row) => (
              <DetailRow
                key={`${section.title}-${row.label}`}
                label={row.label}
                value={row.value}
              />
            ))}
          </DetailSection>
        ))}
      </div>
    </DetailModal>
  );
}
