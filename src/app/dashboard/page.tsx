import DashboardOverviewClient from "@/components/dashboard/DashboardOverviewClient";
import LaporanAktivitasMarketingSection from "@/components/dashboard/LaporanAktivitasMarketingSection";
import LaporanNPFSection from "@/components/dashboard/LaporanNPFSection";
import LaporanPihakKetigaSection from "@/components/dashboard/LaporanPihakKetigaSection";
import LaporanTitipanSection from "@/components/dashboard/LaporanTitipanSection";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <DashboardOverviewClient />
      <LaporanPihakKetigaSection />
      <LaporanTitipanSection />
      <LaporanNPFSection />
      <LaporanAktivitasMarketingSection />
    </div>
  );
}
