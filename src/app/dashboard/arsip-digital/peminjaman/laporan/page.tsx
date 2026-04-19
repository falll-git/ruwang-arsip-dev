"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileBarChart2,
  FileSpreadsheet,
  Search,
  Filter,
} from "lucide-react";
import { exportToExcel } from "@/lib/utils/exportExcel";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { useAuth } from "@/components/auth/AuthProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { filterDigitalDocuments } from "@/lib/rbac";
import {
  formatDateDisplay,
  parseDateString,
  toIsoDate,
} from "@/lib/utils/date";
import { useArsipDigitalWorkflow } from "@/components/arsip-digital/ArsipDigitalWorkflowProvider";

function formatPersonName(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "-") return value;
  return trimmed
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function LaporanPeminjamanPage() {
  const { role, user } = useAuth();
  const { dokumen, peminjaman } = useArsipDigitalWorkflow();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dokumenAkses = useMemo(() => {
    if (!role) return [];
    return filterDigitalDocuments(user?.is_restrict ?? false, dokumen);
  }, [dokumen, role, user?.is_restrict]);

  const dokumenAksesById = useMemo(
    () => new Map(dokumenAkses.map((d) => [d.id, d])),
    [dokumenAkses],
  );

  const riwayatPeminjaman = useMemo(() => {
    const today = toIsoDate(new Date());
    return peminjaman
      .filter((p) => dokumenAksesById.has(p.dokumenId))
      .map((p) => {
        const dokumen = dokumenAksesById.get(p.dokumenId);
        const status =
          p.status === "Dipinjam"
            ? "Aktif"
            : p.status === "Dikembalikan"
              ? "Dikembalikan"
              : p.status === "Pending"
                ? "Pending"
                : "Ditolak";

        const jatuhTempoDate = parseDateString(p.tglKembali);
        const jatuhTempoIso = jatuhTempoDate ? toIsoDate(jatuhTempoDate) : "";

        return {
          id: p.id,
          kode: dokumen?.kode ?? `DOK-${p.dokumenId}`,
          namaDokumen: dokumen?.namaDokumen ?? "-",
          peminjam: p.peminjam,
          tglPinjam: p.tglPinjam,
          tglKembali: p.tglPengembalian ?? p.tglKembali,
          jatuhTempo: p.tglKembali,
          status,
          approvedBy: p.approver ?? "-",
          isTerlambat:
            p.status === "Dipinjam" &&
            Boolean(jatuhTempoIso) &&
            jatuhTempoIso < today,
        };
      });
  }, [dokumenAksesById, peminjaman]);

  const normalizedFrom =
    dateFrom && dateTo && dateFrom > dateTo ? dateTo : dateFrom;
  const normalizedTo =
    dateFrom && dateTo && dateFrom > dateTo ? dateFrom : dateTo;

  const filteredData = riwayatPeminjaman.filter((item) => {
    const matchSearch =
      item.namaDokumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.peminjam.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "Semua" || item.status === filterStatus;

    const pinjamDate = parseDateString(item.tglPinjam);
    const pinjamIso = pinjamDate ? toIsoDate(pinjamDate) : "";
    const matchFrom =
      !normalizedFrom || (pinjamIso && pinjamIso >= normalizedFrom);
    const matchTo = !normalizedTo || (pinjamIso && pinjamIso <= normalizedTo);

    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  const totalAktif = riwayatPeminjaman.filter(
    (d) => d.status === "Aktif",
  ).length;
  const totalDikembalikan = riwayatPeminjaman.filter(
    (d) => d.status === "Dikembalikan",
  ).length;

  const handleExport = async () => {
    await exportToExcel({
      filename: "laporan-peminjaman",
      sheetName: "Peminjaman",
      title: "Laporan Peminjaman Dokumen",
      columns: [
        { header: "No", key: "no", width: 6 },
        { header: "Kode", key: "kode", width: 15 },
        { header: "Nama Dokumen", key: "namaDokumen", width: 30 },
        { header: "Peminjam", key: "peminjam", width: 20 },
        { header: "Tgl Pinjam", key: "tglPinjam", width: 15 },
        { header: "Tgl Kembali", key: "tglKembali", width: 15 },
        { header: "Approved By", key: "approvedBy", width: 15 },
        { header: "Status", key: "status", width: 15 },
      ],
      data: filteredData.map((item, idx) => ({
        no: idx + 1,
        kode: item.kode,
        namaDokumen: item.namaDokumen,
        peminjam: item.peminjam,
        tglPinjam: formatDateDisplay(item.tglPinjam),
        tglKembali: formatDateDisplay(item.tglKembali),
        approvedBy: item.approvedBy,
        status:
          item.status === "Aktif"
            ? "Dipinjam"
            : item.status === "Pending"
              ? "Pending"
              : item.status === "Dikembalikan"
                ? "Dikembalikan"
                : "Ditolak",
      })),
    });
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <FeatureHeader
        title="Laporan Peminjaman"
        subtitle="Daftar riwayat peminjaman dan pengembalian dokumen fisik."
        icon={<FileBarChart2 />}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Total Peminjaman
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {riwayatPeminjaman.length}
            </p>
          </div>
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <FileBarChart2 className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Sedang Dipinjam
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalAktif}
            </p>
          </div>
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Sudah Dikembalikan
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalDikembalikan}
            </p>
          </div>
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Cari Dokumen
            </label>
            <div className="relative">
              <Search
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Dokumen, Peminjam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-with-icon"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Status Peminjaman
            </label>
            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select input-with-icon"
              >
                <option value="Semua">Semua Status</option>
                <option value="Pending">Menunggu Persetujuan</option>
                <option value="Aktif">Sedang Dipinjam</option>
                <option value="Dikembalikan">Dikembalikan</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Dari Tanggal
            </label>
            <DatePickerInput value={dateFrom} onChange={setDateFrom} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Sampai Tanggal
            </label>
            <DatePickerInput value={dateTo} onChange={setDateTo} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">
            Menampilkan{" "}
            <span className="font-bold text-gray-900">
              {filteredData.length}
            </span>{" "}
            data
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Kode
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nama Dokumen
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Peminjam
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tgl Pinjam
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tgl Kembali
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Approved By
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50/50 transition-colors ${item.isTerlambat ? "bg-red-50/30" : ""}`}
                >
                  <td className="px-6 py-4 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded border border-primary-100 text-xs font-medium tabular-nums">
                      {item.kode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {item.namaDokumen}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-800">
                      {formatPersonName(item.peminjam)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateDisplay(item.tglPinjam)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateDisplay(item.tglKembali)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    {formatPersonName(item.approvedBy)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${
                          item.status === "Aktif"
                            ? item.isTerlambat
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                            : item.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : item.status === "Dikembalikan"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                    >
                      {item.status === "Aktif" ? (
                        <>
                          <BookOpen
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          {item.isTerlambat ? "Terlambat" : "Dipinjam"}
                        </>
                      ) : item.status === "Pending" ? (
                        <>
                          <BookOpen
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          Pending
                        </>
                      ) : item.status === "Dikembalikan" ? (
                        <>
                          <CheckCircle2
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          Diserahkan
                        </>
                      ) : (
                        <>
                          <BookOpen
                            className="w-3.5 h-3.5"
                            aria-hidden="true"
                          />
                          Ditolak
                        </>
                      )}
                    </span>
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
