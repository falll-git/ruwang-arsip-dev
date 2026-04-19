"use client";

import { useMemo, useState } from "react";
import { Archive, FileSpreadsheet, Search } from "lucide-react";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { useAuth } from "@/components/auth/AuthProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { filterDigitalDocuments } from "@/lib/rbac";
import { formatDateDisplay } from "@/lib/utils/date";
import { useArsipDigitalMasterData } from "@/components/arsip-digital/ArsipDigitalMasterDataProvider";
import { useArsipDigitalWorkflow } from "@/components/arsip-digital/ArsipDigitalWorkflowProvider";

const formatPersonName = (value: string) =>
  value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function HistorisPenyimpananPage() {
  const { role, user } = useAuth();
  const { tempatPenyimpanan } = useArsipDigitalMasterData();
  const { dokumen } = useArsipDigitalWorkflow();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAksi, setFilterAksi] = useState("Semua");

  const dokumenAkses = useMemo(() => {
    if (!role) return [];
    return filterDigitalDocuments(user?.is_restrict ?? false, dokumen);
  }, [dokumen, role, user?.is_restrict]);

  const historisPenyimpanan = useMemo(() => {
    return dokumenAkses.map((d, idx) => {
      const tempat = tempatPenyimpanan.find(
        (t) => t.id === d.tempatPenyimpananId,
      );
      return {
        id: d.id,
        kode: d.kode,
        namaDokumen: d.namaDokumen,
        aksi: "Input Baru",
        lokasiLama: "-",
        lokasiBaru: tempat
          ? `${tempat.namaKantor} - ${tempat.kodeLemari} (${tempat.rak})`
          : `Tempat ID: ${d.tempatPenyimpananId}`,
        user: d.userInput,
        tanggal: d.tglInput,
        jam: `${9 + idx}:${(idx * 15) % 60 < 10 ? "0" : ""}${(idx * 15) % 60}`,
      };
    });
  }, [dokumenAkses, tempatPenyimpanan]);

  const filteredData = historisPenyimpanan.filter((item) => {
    const matchSearch =
      item.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAksi = filterAksi === "Semua" || item.aksi === filterAksi;
    return matchSearch && matchAksi;
  });

  const handleExport = async () => {
    await exportToExcel({
      filename: "historis-penyimpanan",
      sheetName: "Historis Penyimpanan",
      title: "Historis Penyimpanan Dokumen",
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Tanggal", key: "tanggal", width: 15 },
        { header: "Jam", key: "jam", width: 10 },
        { header: "Kode", key: "kode", width: 15 },
        { header: "Nama Dokumen", key: "namaDokumen", width: 30 },
        { header: "Aksi", key: "aksi", width: 15 },
        { header: "Lokasi Lama", key: "lokasiLama", width: 20 },
        { header: "Lokasi Baru", key: "lokasiBaru", width: 20 },
        { header: "User", key: "user", width: 15 },
      ],
      data: filteredData.map((item, idx) => ({
        no: idx + 1,
        tanggal: formatDateDisplay(item.tanggal),
        jam: item.jam,
        kode: item.kode,
        namaDokumen: item.namaDokumen,
        aksi: item.aksi,
        lokasiLama: item.lokasiLama,
        lokasiBaru: item.lokasiBaru,
        user: item.user,
      })),
    });
  };

  return (
    <div className="animate-fade-in">
      <FeatureHeader
        title="Historis Penyimpanan"
        subtitle="Riwayat perubahan lokasi dan data penyimpanan dokumen"
        icon={<Archive />}
        actions={
          <button
            onClick={handleExport}
            className="btn btn-export-excel"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
            <span>Export Excel</span>
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {historisPenyimpanan.length}
          </p>
          <p className="text-sm text-gray-500">Total Aktivitas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {historisPenyimpanan.filter((d) => d.aksi === "Input Baru").length}
          </p>
          <p className="text-sm text-gray-500">Input Baru</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {
              historisPenyimpanan.filter((d) => d.aksi === "Pindah Lokasi")
                .length
            }
          </p>
          <p className="text-sm text-gray-500">Pindah Lokasi</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">
            {historisPenyimpanan.filter((d) => d.aksi === "Edit Data").length}
          </p>
          <p className="text-sm text-gray-500">Edit Data</p>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Cari
            </label>
            <div className="relative">
              <Search
                className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Cari dokumen atau user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-with-icon"
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter Aksi
            </label>
            <select
              value={filterAksi}
              onChange={(e) => setFilterAksi(e.target.value)}
              className="select"
            >
              <option value="Semua">Semua Aksi</option>
              <option value="Input Baru">Input Baru</option>
              <option value="Pindah Lokasi">Pindah Lokasi</option>
              <option value="Edit Data">Edit Data</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  No
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Jam
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Kode
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Nama Dokumen
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Aksi
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Lokasi Lama
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Lokasi Baru
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateDisplay(item.tanggal)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.jam}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-lg border-2 border-gray-800 bg-white px-3 py-1 text-xs font-semibold text-gray-900 tabular-nums">
                      {item.kode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {item.namaDokumen}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        item.aksi === "Input Baru"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : item.aksi === "Pindah Lokasi"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.aksi}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.lokasiLama}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {item.lokasiBaru}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    {formatPersonName(item.user)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
