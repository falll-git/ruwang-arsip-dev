import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";

import CetakDokumenSection from "@/components/legal/CetakDokumenSection";
import ProgresPHK3Section from "@/components/legal/ProgresPHK3Section";
import FeatureHeader from "@/components/ui/FeatureHeader";

export const metadata = {
  title: "Laporan Legal",
};

export default function LaporanLegalPage() {
  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="mb-4">
        <Link href="/dashboard" className="btn btn-outline btn-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Dashboard
        </Link>
      </div>

      <FeatureHeader
        title="Laporan Legal"
        subtitle="Rekap cetak dokumen dan progres penanganan PHK3."
        icon={<BarChart2 />}
      />

      <div className="mt-6 space-y-6">
        <CetakDokumenSection />
        <ProgresPHK3Section />
      </div>
    </div>
  );
}
