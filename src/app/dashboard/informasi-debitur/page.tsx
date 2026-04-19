"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, type CSSProperties } from "react";
import {
  ArrowLeft,
  ChevronUp,
  FileDown,
  FileSpreadsheet,
  Search,
  Users,
} from "lucide-react";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { dummyDebiturList, formatCurrency } from "@/lib/data";
import KolBadge from "@/components/marketing/KolBadge";

type SortField = "namaNasabah" | "osPokok" | "kolektibilitas";
type SortOrder = "asc" | "desc";

export default function ListDebiturPage() {
  const router = useRouter();
  const { showToast } = useAppToast();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("namaNasabah");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterKol, setFilterKol] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState<"excel" | "pdf" | null>(
    null,
  );
  const itemsPerPage = 5;

  const filteredData = useMemo(() => {
    let data = [...dummyDebiturList];

    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        (d) =>
          d.namaNasabah.toLowerCase().includes(searchLower) ||
          d.noKontrak.toLowerCase().includes(searchLower),
      );
    }

    if (filterKol !== "all") {
      data = data.filter((d) => d.kolektibilitas === filterKol);
    }

    data.sort((a, b) => {
      let compare = 0;
      if (sortField === "namaNasabah") {
        compare = a.namaNasabah.localeCompare(b.namaNasabah);
      } else if (sortField === "osPokok") {
        compare = a.osPokok - b.osPokok;
      } else if (sortField === "kolektibilitas") {
        compare = parseInt(a.kolektibilitas) - parseInt(b.kolektibilitas);
      }
      return sortOrder === "asc" ? compare : -compare;
    });

    return data;
  }, [search, sortField, sortOrder, filterKol]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleExport = (type: "excel" | "pdf") => {
    setExportLoading(type);
    setExportLoading(null);
    showToast(`Export ${type.toUpperCase()} berhasil!`, "success");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Kembali ke Dashboard
          </Link>
        </div>

        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4">
          <div className="flex gap-4">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard" className="btn btn-outline btn-sm">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Dashboard
        </Link>
      </div>

      <FeatureHeader
        title="List Debitur"
        subtitle="Daftar nasabah pembiayaan"
        icon={<Users />}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("excel")}
              disabled={exportLoading !== null}
              className="btn btn-export-excel"
              title="Export Excel"
            >
              {exportLoading === "excel" ? (
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
              ) : (
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              )}
              Export Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exportLoading !== null}
              className="btn btn-export-pdf"
              title="Export PDF"
            >
              {exportLoading === "pdf" ? (
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
              ) : (
                <FileDown className="w-4 h-4" aria-hidden="true" />
              )}
              Export PDF
            </button>
          </div>
        }
      />

      <div
        className="bg-white rounded-xl p-5"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-60 w-full sm:w-auto">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Cari nama nasabah atau no kontrak..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-with-icon"
              />
            </div>
          </div>

          <div className="shrink-0 min-w-50 w-full sm:w-60">
            <select
              value={filterKol}
              onChange={(e) => {
                setFilterKol(e.target.value);
                setCurrentPage(1);
              }}
              className="select"
            >
              <option value="all">Semua Kolektibilitas</option>
              <option value="1">Kol 1 - Lancar</option>
              <option value="2">Kol 2 - DPK</option>
              <option value="3">Kol 3 - Kurang Lancar</option>
              <option value="4">Kol 4 - Diragukan</option>
              <option value="5">Kol 5 - Macet</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{
          boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  No
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  No Kontrak
                </th>
                <th
                  className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("namaNasabah")}
                >
                  <div className="flex items-center gap-1">
                    Nama Nasabah
                    {sortField === "namaNasabah" && (
                      <ChevronUp
                        className={`w-4 h-4 ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </th>
                <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Cabang
                </th>
                <th
                  className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("osPokok")}
                >
                  <div className="flex items-center justify-end gap-1">
                    OS Pokok
                    {sortField === "osPokok" && (
                      <ChevronUp
                        className={`w-4 h-4 ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </th>
                <th
                  className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort("kolektibilitas")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Kol
                    {sortField === "kolektibilitas" && (
                      <ChevronUp
                        className={`w-4 h-4 ${sortOrder === "desc" ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </th>
                <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item, idx) => (
                <tr
                  key={item.id}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/informasi-debitur/${item.id}`)
                  }
                >
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-medium text-gray-900 tabular-nums">
                      {item.noKontrak}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.namaNasabah}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.marketing}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {item.cabang}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.osPokok)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <KolBadge kol={item.kolektibilitas} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Link
                      href={`/dashboard/informasi-debitur/${item.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} dari{" "}
              {filteredData.length} data
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === i + 1
                      ? "bg-[#157ec3] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
