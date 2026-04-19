"use client";

import { useState, useMemo } from "react";
import {
  Download,
  Plus,
  Scale,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  CheckCircle,
  Clock,
  RotateCcw,
  Trash2,
  Edit2,
} from "lucide-react";
import {
  dummyTitipanNotaris,
  notarisOptions,
  jenisAktaOptions,
  dummyNasabahLegal,
  TitipanNotaris,
} from "@/lib/data";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import { exportToExcel } from "@/lib/utils/exportExcel";
import { formatDateDisplay, todayIsoDate } from "@/lib/utils/date";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export default function TitipanNotarisPage() {
  const { showToast } = useAppToast();
  const [data, setData] = useState(dummyTitipanNotaris);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterNotaris, setFilterNotaris] = useState("Semua");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showInputAktaModal, setShowInputAktaModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<TitipanNotaris | null>(null);
  const [selectedItem, setSelectedItem] = useState<TitipanNotaris | null>(null);

  const [formNoKontrak, setFormNoKontrak] = useState("");
  const [formNotaris, setFormNotaris] = useState(notarisOptions[0] ?? "");
  const [formJenisAkta, setFormJenisAkta] = useState<
    "APHT" | "Fidusia" | "Roya" | "Surat Kuasa"
  >("APHT");
  const [formNominal, setFormNominal] = useState("");
  const [formNominalBayar, setFormNominalBayar] = useState("");
  const [formTanggalBayar, setFormTanggalBayar] = useState(todayIsoDate());
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formNoAkta, setFormNoAkta] = useState("");
  const [formAlasanKembali, setFormAlasanKembali] = useState("");

  const summary = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.nominal, 0);
    const paid = data
      .filter((d) => d.status === "Sudah Dibayar")
      .reduce((sum, d) => sum + (d.nominalBayar ?? d.nominal), 0);
    const unpaid = data
      .filter((d) => d.status === "Belum Dibayar")
      .reduce((sum, d) => sum + d.nominal, 0);
    return {
      total,
      paid,
      unpaid,
      totalCount: data.length,
      paidCount: data.filter((d) => d.status === "Sudah Dibayar").length,
      unpaidCount: data.filter((d) => d.status === "Belum Dibayar").length,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    let result = [...data];
    if (filterStatus !== "Semua")
      result = result.filter((d) => d.status === filterStatus);
    if (filterNotaris !== "Semua")
      result = result.filter((d) => d.namaNotaris === filterNotaris);
    if (search)
      result = result.filter(
        (d) =>
          d.namaNasabah.toLowerCase().includes(search.toLowerCase()) ||
          d.noKontrak.toLowerCase().includes(search.toLowerCase()),
      );
    return result;
  }, [data, filterStatus, filterNotaris, search]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleAdd = () => {
    const nasabah = dummyNasabahLegal.find(
      (n) => n.noKontrak === formNoKontrak,
    );
    if (!nasabah) {
      showToast("No kontrak tidak ditemukan!", "error");
      return;
    }
    const nominal = Number.parseInt(formNominal, 10) || 0;
    if (nominal <= 0) {
      showToast("Nominal titipan wajib diisi!", "warning");
      return;
    }
    const newItem: TitipanNotaris = {
      id: data.length + 1,
      noKontrak: formNoKontrak,
      namaNasabah: nasabah.nama,
      namaNotaris: formNotaris,
      jenisAkta: formJenisAkta,
      nominal,
      tanggalSetor: todayIsoDate(),
      status: "Belum Dibayar",
      userInput: "SYSTEM",
      keterangan: formKeterangan,
    };
    setData([newItem, ...data]);
    setShowAddModal(false);
    resetForm();
    showToast("Data titipan berhasil ditambahkan!", "success");
  };

  const handlePay = () => {
    if (!selectedItem) return;
    const nominalBayar = Number.parseInt(formNominalBayar, 10) || 0;
    if (nominalBayar <= 0) {
      showToast("Nilai pembayaran wajib diisi!", "warning");
      return;
    }
    if (!formTanggalBayar.trim()) {
      showToast("Tanggal pembayaran wajib diisi!", "warning");
      return;
    }
    setData(
      data.map((d) =>
        d.id === selectedItem.id
          ? {
              ...d,
              status: "Sudah Dibayar" as const,
              nominalBayar,
              tanggalBayar: formTanggalBayar,
              noAkta: formNoAkta.trim(),
            }
          : d,
      ),
    );
    setShowPayModal(false);
    setSelectedItem(null);
    setFormNoAkta("");
    setFormNominalBayar("");
    setFormTanggalBayar(todayIsoDate());
    showToast("Pembayaran berhasil dicatat!", "success");
  };

  const handleInputAkta = () => {
    if (!selectedItem) return;
    setData(
      data.map((d) =>
        d.id === selectedItem.id ? { ...d, noAkta: formNoAkta } : d,
      ),
    );
    setShowInputAktaModal(false);
    setSelectedItem(null);
    showToast("No Akta berhasil diinput!", "success");
  };

  const handleReturn = () => {
    if (!selectedItem) return;
    setData(
      data.map((d) =>
        d.id === selectedItem.id
          ? {
              ...d,
              status: "Dikembalikan" as const,
              tanggalKembali: todayIsoDate(),
              alasanKembali: formAlasanKembali,
            }
          : d,
      ),
    );
    setShowReturnModal(false);
    setSelectedItem(null);
    showToast("Dana berhasil dikembalikan!", "success");
  };

  const handleDelete = (id: number) => {
    if (confirm("Apakah Anda yakin?")) {
      setData(data.filter((d) => d.id !== id));
      showToast("Data berhasil dihapus!", "success");
    }
  };
  const resetForm = () => {
    setFormNoKontrak("");
    setFormNotaris(notarisOptions[0] ?? "");
    setFormJenisAkta("APHT");
    setFormNominal("");
    setFormNominalBayar("");
    setFormTanggalBayar(todayIsoDate());
    setFormKeterangan("");
    setFormNoAkta("");
    setFormAlasanKembali("");
  };

  const handleExportExcel = async () => {
    await exportToExcel({
      filename: "titipan_notaris",
      sheetName: "Dana Titipan Notaris",
      title: "LAPORAN DANA TITIPAN NOTARIS",
      columns: [
        { header: "No", key: "no", width: 5 },
        { header: "No Kontrak", key: "noKontrak", width: 15 },
        { header: "Nama", key: "namaNasabah", width: 20 },
        { header: "Notaris", key: "namaNotaris", width: 25 },
        { header: "Jenis Akta", key: "jenisAkta", width: 12 },
        { header: "No Akta", key: "noAkta", width: 18 },
        { header: "Nominal Titipan", key: "nominalTitipanText", width: 16 },
        { header: "Nominal Bayar", key: "nominalBayarText", width: 16 },
        { header: "Tanggal Bayar", key: "tanggalBayar", width: 14 },
        { header: "Status", key: "status", width: 15 },
      ],
      data: filteredData.map((item, idx) => ({
        ...item,
        no: idx + 1,
        nominalTitipanText: formatCurrency(item.nominal),
        nominalBayarText:
          item.status === "Sudah Dibayar"
            ? formatCurrency(item.nominalBayar ?? item.nominal)
            : "-",
      })),
    });
    showToast("Export Excel berhasil!", "success");
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      "Belum Dibayar": "bg-yellow-100 text-yellow-700",
      "Sudah Dibayar": "bg-green-100 text-green-700",
      Dikembalikan: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${classes[status as keyof typeof classes]}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <FeatureHeader
        title="Dana Titipan Notaris"
        subtitle="Kelola dana titipan biaya notaris nasabah"
        icon={<Scale />}
      />

      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-gray-600">
          Total: <span className="font-semibold">{data.length}</span> transaksi
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-upload"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Tambah Titipan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Titipan</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(summary.total)}
              </p>
              <p className="text-xs text-gray-400">
                {summary.totalCount} transaksi
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sudah Dibayar</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(summary.paid)}
              </p>
              <p className="text-xs text-gray-400">
                {summary.paidCount} transaksi
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Belum Dibayar</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(summary.unpaid)}
              </p>
              <p className="text-xs text-gray-400">
                {summary.unpaidCount} transaksi
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Daftar Titipan Notaris
          </h2>
          <button
            onClick={handleExportExcel}
            className="btn btn-export-excel btn-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select"
          >
            <option value="Semua">Semua Status</option>
            <option value="Belum Dibayar">Belum Dibayar</option>
            <option value="Sudah Dibayar">Sudah Dibayar</option>
            <option value="Dikembalikan">Dikembalikan</option>
          </select>
          <select
            value={filterNotaris}
            onChange={(e) => setFilterNotaris(e.target.value)}
            className="select"
          >
            <option value="Semua">Semua Notaris</option>
            {notarisOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="input input-with-icon"
            />
            <Filter className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  No Kontrak
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nasabah
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Notaris
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Jenis
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  No Akta
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Nominal
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {item.noKontrak}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.namaNasabah}</td>
                  <td className="px-4 py-3 text-sm">{item.namaNotaris}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {item.jenisAkta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">
                    {item.noAkta || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(
                      item.status === "Sudah Dibayar"
                        ? (item.nominalBayar ?? item.nominal)
                        : item.nominal,
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setDetailItem(item);
                          setShowDetailModal(true);
                        }}
                        className="btn btn-outline btn-sm"
                        title="Detail"
                      >
                        Detail
                      </button>
                      {item.status === "Sudah Dibayar" && !item.noAkta && (
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowInputAktaModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-100"
                          title="Input No Akta"
                        >
                          <Edit2 className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                      {item.status === "Belum Dibayar" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setFormNoAkta(item.noAkta ?? "");
                              setFormNominalBayar(
                                String(item.nominalBayar ?? item.nominal),
                              );
                              setFormTanggalBayar(todayIsoDate());
                              setShowPayModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-green-100"
                            title="Bayar"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setShowReturnModal(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-yellow-100"
                            title="Kembalikan"
                          >
                            <RotateCcw className="w-4 h-4 text-yellow-500" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredData.length)} dari{" "}
              {filteredData.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tambah Titipan Notaris</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No Kontrak
                </label>
                <input
                  type="text"
                  list="nasabah-kontrak-titipan-notaris"
                  value={formNoKontrak}
                  onChange={(e) => setFormNoKontrak(e.target.value)}
                  className="input"
                  placeholder="PB/2024/001234"
                />
                <datalist id="nasabah-kontrak-titipan-notaris">
                  {dummyNasabahLegal.map((n) => (
                    <option
                      key={n.noKontrak}
                      value={n.noKontrak}
                      label={n.nama}
                    />
                  ))}
                </datalist>
                <p className="text-xs text-gray-500 mt-1">
                  Tips: pilih No Kontrak dari daftar agar data nasabah valid.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notaris
                  </label>
                  <select
                    value={formNotaris}
                    onChange={(e) => setFormNotaris(e.target.value)}
                    className="select"
                  >
                    {notarisOptions.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jenis Akta
                  </label>
                  <select
                    value={formJenisAkta}
                    onChange={(e) =>
                      setFormJenisAkta(e.target.value as typeof formJenisAkta)
                    }
                    className="select"
                  >
                    {jenisAktaOptions.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nominal
                </label>
                <input
                  type="text"
                  value={
                    formNominal
                      ? formatCurrency(Number.parseInt(formNominal, 10))
                      : ""
                  }
                  onChange={(e) =>
                    setFormNominal(e.target.value.replace(/\D/g, ""))
                  }
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  className="input"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button onClick={handleAdd} className="btn btn-upload flex-1">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowPayModal(false);
            setSelectedItem(null);
            setFormNoAkta("");
            setFormNominalBayar("");
            setFormTanggalBayar(todayIsoDate());
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Konfirmasi Pembayaran</h3>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedItem(null);
                  setFormNoAkta("");
                  setFormNominalBayar("");
                  setFormTanggalBayar(todayIsoDate());
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-green-50 rounded-xl mb-4">
              <p className="text-sm text-green-800">
                <strong>{selectedItem.namaNasabah}</strong> -{" "}
                {selectedItem.namaNotaris}
              </p>
              <p className="text-sm text-gray-700 mt-1">Nominal Titipan</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(selectedItem.nominal)}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nilai Pembayaran
                </label>
                <input
                  type="text"
                  value={
                    formNominalBayar
                      ? formatCurrency(Number.parseInt(formNominalBayar, 10))
                      : ""
                  }
                  onChange={(e) =>
                    setFormNominalBayar(e.target.value.replace(/\D/g, ""))
                  }
                  className="input"
                  placeholder="Rp 0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal Pembayaran
                </label>
                <input
                  type="date"
                  value={formTanggalBayar}
                  onChange={(e) => setFormTanggalBayar(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  No Akta (opsional)
                </label>
                <input
                  type="text"
                  value={formNoAkta}
                  onChange={(e) => setFormNoAkta(e.target.value)}
                  className="input"
                  placeholder="APHT/001/I/2026"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedItem(null);
                  setFormNoAkta("");
                  setFormNominalBayar("");
                  setFormTanggalBayar(todayIsoDate());
                }}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button onClick={handlePay} className="btn btn-primary flex-1">
                Konfirmasi Bayar
              </button>
            </div>
          </div>
        </div>
      )}

      {showInputAktaModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowInputAktaModal(false);
            setSelectedItem(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Input No Akta</h3>
              <button
                onClick={() => {
                  setShowInputAktaModal(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl mb-4">
              <p className="text-sm text-blue-800">
                <strong>{selectedItem.namaNasabah}</strong>
              </p>
              <p className="text-sm text-blue-600">
                {selectedItem.namaNotaris} - {selectedItem.jenisAkta}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                No Akta
              </label>
              <input
                type="text"
                value={formNoAkta}
                onChange={(e) => setFormNoAkta(e.target.value)}
                className="input"
                placeholder="APHT/001/I/2026"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInputAktaModal(false);
                  setSelectedItem(null);
                }}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button
                onClick={handleInputAkta}
                className="btn btn-primary flex-1"
              >
                Simpan No Akta
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowReturnModal(false);
            setSelectedItem(null);
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Kembalikan Dana</h3>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-yellow-50 rounded-xl mb-4">
              <p className="text-sm text-yellow-800">
                <strong>{selectedItem.namaNasabah}</strong>
              </p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(selectedItem.nominal)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan
              </label>
              <textarea
                value={formAlasanKembali}
                onChange={(e) => setFormAlasanKembali(e.target.value)}
                rows={3}
                className="textarea"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedItem(null);
                }}
                className="btn btn-outline flex-1"
              >
                Batal
              </button>
              <button onClick={handleReturn} className="btn btn-primary flex-1">
                Kembalikan
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailItem && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowDetailModal(false);
            setDetailItem(null);
          }}
        >
          <div
            className="modal-content modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #157ec3 0%, #0d5a8f 100%)",
                  }}
                >
                  <Scale className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Detail Titipan Notaris
                  </h2>
                  <p className="text-sm text-gray-500">
                    {detailItem.noKontrak}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Nama Nasabah</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.namaNasabah}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Notaris</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.namaNotaris}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Jenis Akta</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.jenisAkta}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tanggal Setor</label>
                  <p className="font-medium text-gray-800">
                    {formatDateDisplay(detailItem.tanggalSetor)}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">
                    Nominal Titipan
                  </label>
                  <p className="font-medium text-gray-800">
                    {formatCurrency(detailItem.nominal)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Nominal Bayar</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.status === "Sudah Dibayar"
                      ? formatCurrency(
                          detailItem.nominalBayar ?? detailItem.nominal,
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(detailItem.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-500">No Akta</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.noAkta || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">User Input</label>
                  <p className="font-medium text-gray-800">
                    {detailItem.userInput}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                Riwayat Transaksi
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Tanggal Bayar</label>
                  <p className="font-medium text-gray-800">
                    {formatDateDisplay(detailItem.tanggalBayar)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Tanggal Kembali
                  </label>
                  <p className="font-medium text-gray-800">
                    {formatDateDisplay(detailItem.tanggalKembali)}
                  </p>
                </div>
              </div>
            </div>

            {detailItem.status === "Dikembalikan" && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Alasan Pengembalian
                </h3>
                <p className="text-sm text-gray-700">
                  {detailItem.alasanKembali?.trim()
                    ? detailItem.alasanKembali
                    : "-"}
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Keterangan</h3>
              <p className="text-sm text-gray-700">
                {detailItem.keterangan?.trim() ? detailItem.keterangan : "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
