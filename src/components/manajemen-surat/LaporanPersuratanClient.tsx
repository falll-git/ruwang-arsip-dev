"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Inbox,
  Mail,
  Search,
  SearchX,
  Send,
  Shield,
  Trash2,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import DetailModal, {
  DetailRow,
  DetailSection,
} from "@/components/marketing/DetailModal";
import DocumentViewButton from "@/components/manajemen-surat/DocumentViewButton";
import MemorandumDisposisiModal from "@/components/manajemen-surat/MemorandumDisposisiModal";
import SuratMasukDisposisiModal from "@/components/manajemen-surat/SuratMasukDisposisiModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import { Button } from "@/components/ui/button";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { useDocumentPreviewContext } from "@/components/ui/DocumentPreviewContext";
import {
  type Memorandum,
  type SuratKeluar,
  type SuratMasuk,
  type SuratUser,
} from "@/lib/data";
import { hasDashboardCapability } from "@/lib/rbac";
import { formatDate, parseDateString } from "@/lib/utils/date";
import { isValidFileUrl } from "@/lib/utils/file";
import { toApiDateTime } from "@/services/api.utils";
import { memorandumService } from "@/services/memorandum.service";
import { suratKeluarService } from "@/services/surat-keluar.service";
import { suratMasukService } from "@/services/surat-masuk.service";
import { userService } from "@/services/user.service";

type ReportKind = "surat-masuk" | "surat-keluar" | "memorandum";
type SortValue = "terbaru" | "terlama" | "tenggat-terdekat" | "tenggat-terlama";

type SuratMasukRecord = SuratMasuk & {
  fileUrl?: string;
};

type SuratKeluarRecord = SuratKeluar & {
  fileUrl?: string;
};

type MemorandumRecord = Memorandum & {
  fileUrl?: string;
};

type DetailState =
  | {
      kind: "surat-masuk";
      record: SuratMasukRecord;
    }
  | {
      kind: "surat-keluar";
      record: SuratKeluarRecord;
    }
  | {
      kind: "memorandum";
      record: MemorandumRecord;
    };

interface SummaryRow {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface SummaryCardConfig {
  kind: ReportKind;
  title: string;
  icon: LucideIcon;
  totalLabel: string;
  totalValue: number;
  ctaLabel: string;
  infoRows: SummaryRow[];
}

interface ActiveSectionConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  searchPlaceholder: string;
  supportsTenggatSort: boolean;
}

const personLookup = new Map<string, string>();

function normalizePersonName(value: string) {
  const normalized = value.trim();
  if (!normalized) return "-";

  return (
    personLookup.get(normalized.toLowerCase()) ??
    normalized.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function buildUserDisplayName({
  name,
  roleName,
}: {
  name: string;
  roleName?: string;
}) {
  const normalizedName = normalizePersonName(name);
  const normalizedRole = roleName ? normalizePersonName(roleName) : "";

  return normalizedRole
    ? `${normalizedName} ${normalizedRole}`
    : normalizedName;
}

function resolveUserDisplayName(
  value: string,
  userNameById: Map<string, string>,
  fallbackId?: string,
) {
  const directMatch = userNameById.get(value);
  if (directMatch) return directMatch;

  if (fallbackId) {
    const fallbackMatch = userNameById.get(fallbackId);
    if (fallbackMatch) return fallbackMatch;
  }

  return normalizePersonName(value);
}

function sortByDate<T>(
  records: T[],
  getDate: (record: T) => string,
  sort: "terbaru" | "terlama",
) {
  return [...records].sort((left, right) => {
    const leftDate = parseDateString(getDate(left)) ?? new Date(0);
    const rightDate = parseDateString(getDate(right)) ?? new Date(0);

    if (sort === "terlama") {
      return leftDate.getTime() - rightDate.getTime();
    }

    return rightDate.getTime() - leftDate.getTime();
  });
}

function sortByTenggat<T>(
  records: T[],
  getTenggat: (record: T) => string | undefined,
  sort: "tenggat-terdekat" | "tenggat-terlama",
) {
  return [...records].sort((left, right) => {
    const leftValue = getTenggat(left);
    const rightValue = getTenggat(right);
    const leftDate = leftValue ? new Date(leftValue) : undefined;
    const rightDate = rightValue ? new Date(rightValue) : undefined;
    const leftTime =
      leftDate && !Number.isNaN(leftDate.getTime()) ? leftDate.getTime() : null;
    const rightTime =
      rightDate && !Number.isNaN(rightDate.getTime())
        ? rightDate.getTime()
        : null;

    if (leftTime === null && rightTime === null) return 0;
    if (leftTime === null) return 1;
    if (rightTime === null) return -1;

    return sort === "tenggat-terdekat"
      ? leftTime - rightTime
      : rightTime - leftTime;
  });
}

function sortRecords<T>(
  records: T[],
  getDate: (record: T) => string,
  getTenggat: (record: T) => string | undefined,
  sort: SortValue,
) {
  if (sort === "tenggat-terdekat" || sort === "tenggat-terlama") {
    return sortByTenggat(records, getTenggat, sort);
  }

  return sortByDate(records, getDate, sort);
}

function formatDisplayDate(value: string) {
  return formatDate(value);
}

function formatTenggatDate(value: string) {
  return formatDate(value);
}

function getTenggatStats<T>(
  records: T[],
  getTenggat: (record: T) => string | undefined,
  today: Date,
) {
  let memilikiTenggat = 0;
  let melewatiTenggat = 0;

  records.forEach((record) => {
    const value = getTenggat(record);
    if (!value) return;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return;
    memilikiTenggat += 1;
    if (parsed < today) {
      melewatiTenggat += 1;
    }
  });

  return { memilikiTenggat, melewatiTenggat };
}

function getTenggatStatus(value: string | undefined, today: Date) {
  if (!value) {
    return {
      label: "—",
      variant: "none" as const,
    };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      label: "—",
      variant: "none" as const,
    };
  }

  if (parsed < today) {
    return {
      label: "Lewat",
      variant: "overdue" as const,
    };
  }

  return {
    label: "Aktif",
    variant: "active" as const,
  };
}

function summarize(values: string[], limit = 2) {
  if (values.length === 0) {
    return "-";
  }

  if (values.length <= limit) {
    return values.join(", ");
  }

  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
}

function formatSuratMasukStatus(status: SuratMasuk["status"]) {
  if (status === "SELESAI") return "Selesai";
  return status === "DIDISPOSISI" ? "Disposisi" : "Baru";
}

function formatSuratMasukBadgeStatus(status: SuratMasuk["status"]) {
  if (status === "SELESAI") return "Selesai";
  return status === "DIDISPOSISI" ? "Disposisi" : "Baru";
}

function formatDetailTenggatValue(value: string | undefined) {
  return value ? formatDate(value) : "-";
}

function formatDetailTenggatStatus(value: string | undefined, today: Date) {
  const status = getTenggatStatus(value, today);
  return status.variant === "none" ? "-" : status.label;
}

function formatJoinedNames(values: string[]) {
  return values.length > 0 ? values.join(", ") : "-";
}

function formatDocumentFileName(value: string) {
  const normalized = value.trim();
  return normalized ? normalized : "Belum tersedia";
}

function normalizeSuratMasukRecord(
  record: SuratMasuk,
  userNameById: Map<string, string>,
): SuratMasukRecord {
  return {
    ...record,
    disposisiKepada: record.disposisiKepada.map((name) =>
      resolveUserDisplayName(name, userNameById),
    ),
    disposisi_history: record.disposisi_history.map((item) => ({
      ...item,
      dari_user_nama: resolveUserDisplayName(
        item.dari_user_nama,
        userNameById,
        item.dari_user_id,
      ),
      ke_user_nama: resolveUserDisplayName(
        item.ke_user_nama,
        userNameById,
        item.ke_user_id,
      ),
    })),
    fileUrl: record.fileUrl,
  };
}

function normalizeMemorandumRecord(
  record: Memorandum,
  userNameById: Map<string, string>,
): MemorandumRecord {
  return {
    ...record,
    pembuatMemo: resolveUserDisplayName(record.pembuatMemo, userNameById),
    penerima:
      record.penerimaTipe === "perorangan"
        ? record.penerima.map((name) =>
            resolveUserDisplayName(name, userNameById),
          )
        : record.penerima,
    disposisi_history: record.disposisi_history.map((item) => ({
      ...item,
      dari_user_nama: resolveUserDisplayName(
        item.dari_user_nama,
        userNameById,
        item.dari_user_id,
      ),
      ke_user_nama: resolveUserDisplayName(
        item.ke_user_nama,
        userNameById,
        item.ke_user_id,
      ),
    })),
    fileUrl: record.fileUrl,
  };
}

function SuratMasukStatusBadge({ status }: { status: SuratMasuk["status"] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        status === "SELESAI"
          ? "border-slate-200 bg-slate-100 text-slate-700"
          : status === "DIDISPOSISI"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      {formatSuratMasukBadgeStatus(status)}
    </span>
  );
}

const activeSectionConfig: Record<ReportKind, ActiveSectionConfig> = {
  "surat-masuk": {
    title: "Daftar Surat Masuk",
    subtitle: "Klik dua kali pada baris untuk membuka detail surat masuk.",
    icon: Inbox,
    searchPlaceholder: "Cari nama pengirim, perihal, atau nomor surat",
    supportsTenggatSort: true,
  },
  "surat-keluar": {
    title: "Daftar Surat Keluar",
    subtitle: "Klik dua kali pada baris untuk membuka detail surat keluar.",
    icon: Send,
    searchPlaceholder: "Cari nama penerima, alamat, atau nomor surat",
    supportsTenggatSort: false,
  },
  memorandum: {
    title: "Daftar Memorandum",
    subtitle: "Klik dua kali pada baris untuk membuka detail memorandum.",
    icon: FileText,
    searchPlaceholder:
      "Cari nomor memo, perihal, divisi, pembuat, atau penerima",
    supportsTenggatSort: true,
  },
};

const ACTION_ICON_BUTTON_CLASS = "rounded-lg p-2 transition-colors";

function SelectionState() {
  return (
    <div className="rounded-2xl border border-dashed border-blue-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Mail className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        Pilih kategori persuratan
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        Klik salah satu kartu di atas untuk menampilkan daftar surat atau
        memorandum.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
        <SearchX className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="text-lg font-medium text-gray-900">
        Tidak ada data yang sesuai filter
      </p>
    </div>
  );
}

function DetailButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      Detail
    </Button>
  );
}

function DisposisiButton({
  onClick,
  isRedisposisi = false,
}: {
  onClick: () => void;
  isRedisposisi?: boolean;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <Send className="h-4 w-4" aria-hidden="true" />
      {isRedisposisi ? "Redisposisi" : "Disposisi"}
    </Button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${ACTION_ICON_BUTTON_CLASS} text-red-600 hover:bg-red-50 hover:text-red-700`}
      title="Hapus"
      aria-label="Hapus"
    >
      <Trash2 className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

function DocumentSection({
  fileName,
  hasFile,
  onPreview,
}: {
  fileName: string;
  hasFile: boolean;
  onPreview: () => void;
}) {
  return (
    <DetailSection title="Dokumen">
      <DetailRow label="Nama File" value={formatDocumentFileName(fileName)} />
      <DetailRow
        label="Aksi"
        value={
          <DocumentViewButton
            onClick={onPreview}
            title={hasFile ? "View dokumen" : "File belum tersedia"}
            disabled={!hasFile}
          />
        }
      />
    </DetailSection>
  );
}

function ReportSectionShell({
  title,
  subtitle,
  icon: Icon,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  supportsTenggatSort,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sortValue: SortValue;
  onSortChange: (value: SortValue) => void;
  supportsTenggatSort: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d8fe1] to-[#0d5a8f] text-white shadow-md">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
            Tutup List
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-100 px-6 py-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Cari Data
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                className="input input-with-icon"
                placeholder={searchPlaceholder}
              />
            </div>
          </div>

          <div>
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
                  onSortChange(event.target.value as SortValue)
                }
                className="select input-with-icon"
                aria-label={`Urutkan ${title}`}
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
                {supportsTenggatSort ? (
                  <>
                    <option value="tenggat-terdekat">Tenggat Terdekat</option>
                    <option value="tenggat-terlama">Tenggat Terlama</option>
                  </>
                ) : null}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export default function LaporanPersuratanClient() {
  const { openPreview } = useDocumentPreviewContext();
  const { user, role } = useAuth();
  const { showToast } = useAppToast();
  const [activeKind, setActiveKind] = useState<ReportKind | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState<SortValue>("terbaru");
  const [selectedDetail, setSelectedDetail] = useState<DetailState | null>(
    null,
  );
  const [suratMasukRecords, setSuratMasukRecords] = useState<
    SuratMasukRecord[]
  >([]);
  const [isLoadingSuratMasuk, setIsLoadingSuratMasuk] = useState(true);
  const [suratKeluarRecords, setSuratKeluarRecords] = useState<
    SuratKeluarRecord[]
  >([]);
  const [isLoadingSuratKeluar, setIsLoadingSuratKeluar] = useState(true);
  const [memorandumRecords, setMemorandumRecords] = useState<
    MemorandumRecord[]
  >([]);
  const [isLoadingMemorandum, setIsLoadingMemorandum] = useState(true);
  const [deleteOutgoingTarget, setDeleteOutgoingTarget] =
    useState<SuratKeluarRecord | null>(null);
  const [isDeletingSuratKeluar, setIsDeletingSuratKeluar] = useState(false);
  const [deleteMemorandumTarget, setDeleteMemorandumTarget] =
    useState<MemorandumRecord | null>(null);
  const [isDeletingMemorandum, setIsDeletingMemorandum] = useState(false);
  const [disposisiUsers, setDisposisiUsers] = useState<SuratUser[]>([]);
  const [activeDisposisiSuratId, setActiveDisposisiSuratId] = useState<
    string | number | null
  >(null);
  const [selectedDisposisiUserId, setSelectedDisposisiUserId] = useState("");
  const [disposisiUserSearch, setDisposisiUserSearch] = useState("");
  const [disposisiCatatan, setDisposisiCatatan] = useState("");
  const [isDisposisiSubmitting, setIsDisposisiSubmitting] = useState(false);
  const [activeMemorandumDisposisiId, setActiveMemorandumDisposisiId] =
    useState<string | number | null>(null);
  const [
    selectedMemorandumDisposisiUserId,
    setSelectedMemorandumDisposisiUserId,
  ] = useState("");
  const [memorandumDisposisiUserSearch, setMemorandumDisposisiUserSearch] =
    useState("");
  const [memorandumDisposisiDueDate, setMemorandumDisposisiDueDate] =
    useState("");
  const [memorandumDisposisiCatatan, setMemorandumDisposisiCatatan] =
    useState("");
  const [isMemorandumDisposisiSubmitting, setIsMemorandumDisposisiSubmitting] =
    useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SuratMasukRecord | null>(
    null,
  );
  const [isDeletingSuratMasuk, setIsDeletingSuratMasuk] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const canDisposisiSuratMasuk = hasDashboardCapability(
    "/dashboard/manajemen-surat/laporan",
    role,
    user?.role_id,
    "update",
  );
  const canDeleteSuratMasuk = hasDashboardCapability(
    "/dashboard/manajemen-surat/laporan",
    role,
    user?.role_id,
    "delete",
  );
  const activeDisposisiSurat = useMemo(
    () =>
      suratMasukRecords.find(
        (record) => record.id === activeDisposisiSuratId,
      ) ?? null,
    [activeDisposisiSuratId, suratMasukRecords],
  );
  const activeDisposisiMemorandum = useMemo(
    () =>
      memorandumRecords.find(
        (record) => record.id === activeMemorandumDisposisiId,
      ) ?? null,
    [activeMemorandumDisposisiId, memorandumRecords],
  );

  const loadIncomingMailData = useCallback(async (): Promise<
    SuratMasukRecord[]
  > => {
    setIsLoadingSuratMasuk(true);

    try {
      const [suratMasuk, users] = await Promise.all([
        suratMasukService.getAll(),
        userService.getAll(),
      ]);
      const userNameById = new Map(
        users.map((record) => [
          record.id,
          buildUserDisplayName({
            name: record.name,
            roleName: record.role_name,
          }),
        ]),
      );

      const nextRecords = sortByDate(
        suratMasuk.map((record) =>
          normalizeSuratMasukRecord(record, userNameById),
        ),
        (record) => record.tanggalTerima,
        "terbaru",
      );
      setSuratMasukRecords(nextRecords);
      setDisposisiUsers(
        users
          .filter((record) => record.is_active)
          .map((record) => ({
            id: record.id,
            nama: buildUserDisplayName({
              name: record.name,
              roleName: record.role_name,
            }),
            divisi: record.division_name ?? record.division_id,
          })),
      );
      return nextRecords;
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal memuat data surat masuk",
        "error",
      );
      setSuratMasukRecords([]);
      setDisposisiUsers([]);
      return [];
    } finally {
      setIsLoadingSuratMasuk(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadIncomingMailData();
  }, [loadIncomingMailData]);

  const loadOutgoingMailData = useCallback(async (): Promise<
    SuratKeluarRecord[]
  > => {
    setIsLoadingSuratKeluar(true);

    try {
      const suratKeluar = await suratKeluarService.getAll();
      const nextRecords = sortByDate(
        suratKeluar.map((record) => ({
          ...record,
          fileUrl: record.fileUrl,
        })),
        (record) => record.tanggalKirim,
        "terbaru",
      );
      setSuratKeluarRecords(nextRecords);
      return nextRecords;
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal memuat data surat keluar",
        "error",
      );
      setSuratKeluarRecords([]);
      return [];
    } finally {
      setIsLoadingSuratKeluar(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadOutgoingMailData();
  }, [loadOutgoingMailData]);

  const loadMemorandumData = useCallback(async (): Promise<
    MemorandumRecord[]
  > => {
    setIsLoadingMemorandum(true);

    try {
      const [memorandums, users] = await Promise.all([
        memorandumService.getAll(),
        userService.getAll(),
      ]);
      const userNameById = new Map(
        users.map((record) => [
          record.id,
          buildUserDisplayName({
            name: record.name,
            roleName: record.role_name,
          }),
        ]),
      );

      const nextRecords = sortByDate(
        memorandums.map((record) =>
          normalizeMemorandumRecord(record, userNameById),
        ),
        (record) => record.tanggal,
        "terbaru",
      );
      setMemorandumRecords(nextRecords);
      setDisposisiUsers((prev) =>
        prev.length > 0
          ? prev
          : users
              .filter((record) => record.is_active)
              .map((record) => ({
                id: record.id,
                nama: buildUserDisplayName({
                  name: record.name,
                  roleName: record.role_name,
                }),
                divisi: record.division_name ?? record.division_id,
              })),
      );
      return nextRecords;
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal memuat data memorandum",
        "error",
      );
      setMemorandumRecords([]);
      return [];
    } finally {
      setIsLoadingMemorandum(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadMemorandumData();
  }, [loadMemorandumData]);

  const handlePreviewDocument = useCallback(
    (fileUrl: string | undefined, fileName: string) => {
      if (!fileUrl) {
        showToast("File dokumen belum tersedia dari server.", "warning");
        return;
      }

      openPreview(fileUrl, formatDocumentFileName(fileName));
    },
    [openPreview, showToast],
  );

  const handleDeleteSuratKeluar = (record: SuratKeluarRecord) => {
    setDeleteOutgoingTarget(record);
  };

  const handleConfirmDeleteSuratKeluar = async () => {
    if (!deleteOutgoingTarget) return;

    setIsDeletingSuratKeluar(true);
    try {
      await suratKeluarService.remove(String(deleteOutgoingTarget.id));
      const nextRecords = await loadOutgoingMailData();

      setSelectedDetail((prev) => {
        if (!prev || prev.kind !== "surat-keluar") return prev;
        return prev.record.id === deleteOutgoingTarget.id ? null : prev;
      });

      if (nextRecords.length === 0 && activeKind === "surat-keluar") {
        setSelectedDetail(null);
      }

      setDeleteOutgoingTarget(null);
      showToast("Surat keluar berhasil dihapus.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menghapus surat keluar",
        "error",
      );
    } finally {
      setIsDeletingSuratKeluar(false);
    }
  };

  const handleOpenMemorandumDisposisi = (memorandumId: string | number) => {
    setActiveMemorandumDisposisiId(memorandumId);
    setSelectedMemorandumDisposisiUserId("");
    setMemorandumDisposisiUserSearch("");
    setMemorandumDisposisiDueDate("");
    setMemorandumDisposisiCatatan("");
  };

  const handleCloseMemorandumDisposisi = () => {
    if (isMemorandumDisposisiSubmitting) return;
    setActiveMemorandumDisposisiId(null);
    setSelectedMemorandumDisposisiUserId("");
    setMemorandumDisposisiUserSearch("");
    setMemorandumDisposisiDueDate("");
    setMemorandumDisposisiCatatan("");
  };

  const handleDeleteMemorandum = (record: MemorandumRecord) => {
    setDeleteMemorandumTarget(record);
  };

  const handleConfirmDeleteMemorandum = async () => {
    if (!deleteMemorandumTarget) return;

    setIsDeletingMemorandum(true);
    try {
      await memorandumService.remove(String(deleteMemorandumTarget.id));
      const nextRecords = await loadMemorandumData();

      setSelectedDetail((prev) => {
        if (!prev || prev.kind !== "memorandum") return prev;
        return prev.record.id === deleteMemorandumTarget.id ? null : prev;
      });

      if (activeMemorandumDisposisiId === deleteMemorandumTarget.id) {
        handleCloseMemorandumDisposisi();
      }

      if (nextRecords.length === 0 && activeKind === "memorandum") {
        setSelectedDetail(null);
      }

      setDeleteMemorandumTarget(null);
      showToast("Memorandum berhasil dihapus.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menghapus memorandum",
        "error",
      );
    } finally {
      setIsDeletingMemorandum(false);
    }
  };

  const handleSubmitMemorandumDisposisi = async () => {
    if (!activeDisposisiMemorandum) return;

    if (!selectedMemorandumDisposisiUserId) {
      showToast("Tujuan redisposisi wajib dipilih!", "error");
      return;
    }

    setIsMemorandumDisposisiSubmitting(true);

    try {
      await memorandumService.redispose(String(activeDisposisiMemorandum.id), {
        receiver_id: selectedMemorandumDisposisiUserId,
        note: memorandumDisposisiCatatan.trim() || undefined,
        start_date: new Date().toISOString(),
        due_date: memorandumDisposisiDueDate
          ? toApiDateTime(memorandumDisposisiDueDate)
          : undefined,
      });

      const nextRecords = await loadMemorandumData();

      setSelectedDetail((prev) => {
        if (!prev || prev.kind !== "memorandum") return prev;

        const nextRecord =
          nextRecords.find((record) => record.id === prev.record.id) ?? null;

        return nextRecord ? { kind: "memorandum", record: nextRecord } : prev;
      });

      showToast(
        activeDisposisiMemorandum.disposisi_history.length > 0
          ? "Redisposisi memorandum berhasil dikirim!"
          : "Disposisi memorandum berhasil dikirim!",
        "success",
      );
      handleCloseMemorandumDisposisi();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal mengirim redisposisi memorandum",
        "error",
      );
    } finally {
      setIsMemorandumDisposisiSubmitting(false);
    }
  };

  const tenggatStats = useMemo(
    () => ({
      suratMasuk: getTenggatStats(
        suratMasukRecords,
        (record) => record.tenggatWaktu,
        today,
      ),
      suratKeluar: {
        memilikiTenggat: 0,
        melewatiTenggat: 0,
      },
      memorandum: getTenggatStats(
        memorandumRecords,
        (record) => record.tenggatWaktu,
        today,
      ),
    }),
    [memorandumRecords, suratKeluarRecords, suratMasukRecords, today],
  );

  const summaryCards: SummaryCardConfig[] = useMemo(
    () => [
      {
        kind: "surat-masuk",
        title: "Surat Masuk",
        icon: Inbox,
        totalLabel: "TOTAL SURAT",
        totalValue: suratMasukRecords.length,
        ctaLabel: "Lihat Daftar Surat",
        infoRows: [
          {
            icon: CalendarDays,
            label: "Terbaru",
            value: formatDisplayDate(suratMasukRecords[0]?.tanggalTerima ?? ""),
          },
          {
            icon: Shield,
            label: "Sifat",
            value: summarize(
              [...new Set(suratMasukRecords.map((record) => record.sifat))],
              4,
            ),
          },
          {
            icon: Users,
            label: "Disposisi",
            value: `${
              new Set(
                suratMasukRecords
                  .filter((record) => record.status === "DIDISPOSISI")
                  .flatMap((record) => record.disposisiKepada),
              ).size
            } User`,
          },
          {
            icon: CalendarDays,
            label: "Memiliki Tenggat Waktu",
            value: `${tenggatStats.suratMasuk.memilikiTenggat}`,
          },
          {
            icon: AlertTriangle,
            label: "Melewati tenggat waktu",
            value: `${tenggatStats.suratMasuk.melewatiTenggat}`,
          },
        ],
      },
      {
        kind: "surat-keluar",
        title: "Surat Keluar",
        icon: Send,
        totalLabel: "TOTAL SURAT",
        totalValue: suratKeluarRecords.length,
        ctaLabel: "Lihat Daftar Surat",
        infoRows: [
          {
            icon: CalendarDays,
            label: "Terbaru",
            value: formatDisplayDate(suratKeluarRecords[0]?.tanggalKirim ?? ""),
          },
          {
            icon: Shield,
            label: "Sifat",
            value: summarize(
              [...new Set(suratKeluarRecords.map((record) => record.sifat))],
              4,
            ),
          },
          {
            icon: Mail,
            label: "Media",
            value: summarize(
              [...new Set(suratKeluarRecords.map((record) => record.media))],
              3,
            ),
          },
          {
            icon: Shield,
            label: "Status",
            value: summarize(
              [
                ...new Set(
                  suratKeluarRecords.map((record) => record.statusLabel),
                ),
              ],
              3,
            ),
          },
          {
            icon: FileText,
            label: "Dokumen Tersimpan",
            value: `${suratKeluarRecords.filter((record) => Boolean(record.fileName)).length}`,
          },
        ],
      },
      {
        kind: "memorandum",
        title: "Memorandum",
        icon: FileText,
        totalLabel: "TOTAL MEMO",
        totalValue: memorandumRecords.length,
        ctaLabel: "Lihat Daftar Memo",
        infoRows: [
          {
            icon: CalendarDays,
            label: "Terbaru",
            value: formatDisplayDate(memorandumRecords[0]?.tanggal ?? ""),
          },
          {
            icon: Building2,
            label: "Divisi",
            value: summarize(
              [
                ...new Set(
                  memorandumRecords.map((record) => record.divisiPengirim),
                ),
              ],
              3,
            ),
          },
          {
            icon: UserRound,
            label: "Pembuat",
            value: `${new Set(memorandumRecords.map((record) => record.pembuatMemo)).size} User`,
          },
          {
            icon: CalendarDays,
            label: "Memiliki Tenggat Waktu",
            value: `${tenggatStats.memorandum.memilikiTenggat}`,
          },
          {
            icon: AlertTriangle,
            label: "Melewati tenggat waktu",
            value: `${tenggatStats.memorandum.melewatiTenggat}`,
          },
        ],
      },
    ],
    [memorandumRecords, suratKeluarRecords, suratMasukRecords, tenggatStats],
  );

  useEffect(() => {
    if (!activeKind || !reportRef.current) return;

    reportRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeKind]);

  useEffect(() => {
    if (
      typeof document === "undefined" ||
      (activeDisposisiSuratId === null && activeMemorandumDisposisiId === null)
    ) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeDisposisiSuratId, activeMemorandumDisposisiId]);

  const filteredSuratMasuk = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return sortRecords(
      suratMasukRecords.filter((record) => {
        if (!keyword) return true;

        return [
          record.namaSurat,
          record.pengirim,
          record.alamatPengirim,
          record.perihal,
          record.keterangan ?? "",
          record.keteranganTenggat ?? "",
          record.sifat,
          formatSuratMasukStatus(record.status),
          record.disposisiKepada.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      }),
      (record) => record.tanggalTerima,
      (record) => record.tenggatWaktu,
      sortValue,
    );
  }, [searchValue, sortValue, suratMasukRecords]);

  const filteredSuratKeluar = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return sortRecords(
      suratKeluarRecords.filter((record) => {
        if (!keyword) return true;

        return [
          record.namaSurat,
          record.penerima,
          record.alamatPenerima,
          record.media,
          record.sifat,
          record.statusLabel,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      }),
      (record) => record.tanggalKirim,
      () => undefined,
      sortValue,
    );
  }, [searchValue, sortValue, suratKeluarRecords]);

  const filteredMemorandum = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return sortRecords(
      memorandumRecords.filter((record) => {
        if (!keyword) return true;

        return [
          record.noMemo,
          record.perihal,
          record.divisiPengirim,
          record.pembuatMemo,
          record.keterangan,
          record.keteranganTenggat ?? "",
          record.penerima.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      }),
      (record) => record.tanggal,
      (record) => record.tenggatWaktu,
      sortValue,
    );
  }, [memorandumRecords, searchValue, sortValue]);

  const activeConfig = activeKind ? activeSectionConfig[activeKind] : null;

  const handleSelectCard = (kind: ReportKind) => {
    setActiveKind(kind);
    setSearchValue("");
    setSortValue("terbaru");
  };

  const handleOpenDisposisiSidebar = (suratId: string | number) => {
    setActiveDisposisiSuratId(suratId);
    setSelectedDisposisiUserId("");
    setDisposisiUserSearch("");
    setDisposisiCatatan("");
  };

  const handleCloseDisposisiSidebar = () => {
    if (isDisposisiSubmitting) return;
    setActiveDisposisiSuratId(null);
    setSelectedDisposisiUserId("");
    setDisposisiUserSearch("");
    setDisposisiCatatan("");
  };

  const handleDeleteSuratMasuk = (record: SuratMasukRecord) => {
    setDeleteTarget(record);
  };

  const handleConfirmDeleteSuratMasuk = async () => {
    if (!deleteTarget) return;

    setIsDeletingSuratMasuk(true);
    try {
      await suratMasukService.remove(String(deleteTarget.id));
      const nextRecords = await loadIncomingMailData();

      setSelectedDetail((prev) => {
        if (!prev || prev.kind !== "surat-masuk") return prev;
        return prev.record.id === deleteTarget.id ? null : prev;
      });

      if (activeDisposisiSuratId === deleteTarget.id) {
        handleCloseDisposisiSidebar();
      }

      if (nextRecords.length === 0 && activeKind === "surat-masuk") {
        setSelectedDetail(null);
      }

      setDeleteTarget(null);
      showToast("Surat masuk berhasil dihapus.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menghapus surat masuk",
        "error",
      );
    } finally {
      setIsDeletingSuratMasuk(false);
    }
  };

  const handleSubmitDisposisi = async () => {
    if (!activeDisposisiSurat) return;

    if (!selectedDisposisiUserId) {
      showToast("Tujuan disposisi wajib dipilih!", "error");
      return;
    }

    const recipient = disposisiUsers.find(
      (item) => item.id === selectedDisposisiUserId,
    );
    if (!recipient) {
      showToast("Tujuan disposisi tidak ditemukan!", "error");
      return;
    }

    if (!user?.id) {
      showToast("User login tidak ditemukan!", "error");
      return;
    }

    setIsDisposisiSubmitting(true);

    try {
      await suratMasukService.redispose(String(activeDisposisiSurat.id), {
        receiver_id: recipient.id,
        sender_id: user.id,
        note: disposisiCatatan.trim() || undefined,
        start_date: new Date().toISOString(),
        due_date: activeDisposisiSurat.tenggatWaktu
          ? toApiDateTime(activeDisposisiSurat.tenggatWaktu)
          : undefined,
      });

      const nextRecords = await loadIncomingMailData();

      setSelectedDetail((prev) => {
        if (!prev || prev.kind !== "surat-masuk") return prev;

        const nextRecord =
          nextRecords.find((record) => record.id === prev.record.id) ?? null;

        return nextRecord ? { kind: "surat-masuk", record: nextRecord } : prev;
      });

      showToast(
        activeDisposisiSurat.disposisi_history.length > 0
          ? "Disposisi ulang berhasil dikirim!"
          : "Disposisi berhasil dikirim!",
        "success",
      );
      handleCloseDisposisiSidebar();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal mengirim redisposisi",
        "error",
      );
    } finally {
      setIsDisposisiSubmitting(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const isActive = activeKind === card.kind;

          return (
            <button
              key={card.kind}
              type="button"
              onClick={() => handleSelectCard(card.kind)}
              className={`group animate-slide-up rounded-2xl border bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                isActive
                  ? "border-blue-200 ring-2 ring-blue-100"
                  : "border-gray-100 hover:border-blue-200"
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1d8fe1] to-[#0d5a8f] text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900">
                      {card.title}
                    </p>
                  </div>
                </div>

                <div className="flex w-29.5 shrink-0 flex-col items-end text-right">
                  <span className="mb-1 text-xs font-semibold uppercase leading-tight tracking-wider text-gray-400">
                    {card.totalLabel}
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-gray-800">
                    {card.totalValue}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                {card.infoRows.map((row, index) => {
                  const RowIcon = row.icon;

                  return (
                    <div
                      key={`${card.kind}-${row.label}`}
                      className={index === 0 ? "" : "pt-3"}
                    >
                      {index > 0 ? (
                        <div className="mb-3 h-px w-full bg-gray-200" />
                      ) : null}
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2 text-gray-500">
                          <RowIcon
                            className="h-4 w-4 text-gray-500"
                            aria-hidden="true"
                          />
                          {row.label}
                        </span>
                        <span className="font-semibold text-gray-800">
                          {row.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between text-sm font-medium text-primary-600 transition-transform group-hover:translate-x-1">
                <span>{card.ctaLabel}</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>

      <div ref={reportRef}>
        {!activeConfig ? (
          <SelectionState />
        ) : (
          <ReportSectionShell
            title={activeConfig.title}
            subtitle={activeConfig.subtitle}
            icon={activeConfig.icon}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder={activeConfig.searchPlaceholder}
            sortValue={sortValue}
            onSortChange={setSortValue}
            supportsTenggatSort={activeConfig.supportsTenggatSort}
            onClose={() => setActiveKind(null)}
          >
            {activeKind === "surat-masuk" ? (
              isLoadingSuratMasuk ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Inbox className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    Memuat surat masuk
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Data laporan surat masuk sedang diambil dari server.
                  </p>
                </div>
              ) : filteredSuratMasuk.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Nama Pengirim
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Alamat Pengirim
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Nama / Nomor Surat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Perihal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tgl Penerimaan
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Sifat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Disposisi
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                        Status Surat
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap w-36">
                        Tenggat Waktu
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap w-28">
                        Status Tenggat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-72">
                        Keterangan Surat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-72">
                        Catatan Disposisi
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSuratMasuk.map((record, index) => (
                      <tr
                        key={record.id}
                        className="cursor-pointer bg-white hover:bg-gray-50"
                        onDoubleClick={() =>
                          setSelectedDetail({ kind: "surat-masuk", record })
                        }
                      >
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {record.pengirim}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {record.alamatPengirim}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {record.namaSurat}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.perihal}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDisplayDate(record.tanggalTerima)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-sm font-semibold ${
                              record.sifat !== "Biasa"
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {record.sifat}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.disposisiKepada.length > 0
                            ? record.disposisiKepada.join(", ")
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <SuratMasukStatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          {record.tenggatWaktu ? (
                            <span className="whitespace-nowrap text-sm text-gray-700">
                              {formatTenggatDate(record.tenggatWaktu)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const status = getTenggatStatus(
                              record.tenggatWaktu,
                              today,
                            );
                            if (status.variant === "none") {
                              return <span className="text-gray-400">—</span>;
                            }
                            if (status.variant === "overdue") {
                              return (
                                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  <AlertTriangle
                                    className="mr-1 h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {status.label}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2
                                  className="mr-1 h-3 w-3"
                                  aria-hidden="true"
                                />
                                {status.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 align-top">
                          {record.keterangan ? (
                            <p className="line-clamp-2 text-sm text-gray-600">
                              {record.keterangan}
                            </p>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          {record.keteranganTenggat ? (
                            <p className="line-clamp-2 text-sm text-gray-600">
                              {record.keteranganTenggat}
                            </p>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            {canDeleteSuratMasuk ? (
                              <DeleteButton
                                onClick={() => handleDeleteSuratMasuk(record)}
                              />
                            ) : null}
                            <DetailButton
                              onClick={() =>
                                setSelectedDetail({
                                  kind: "surat-masuk",
                                  record,
                                })
                              }
                            />
                            {canDisposisiSuratMasuk &&
                            record.status !== "SELESAI" ? (
                              <DisposisiButton
                                isRedisposisi={
                                  record.disposisi_history.length > 0
                                }
                                onClick={() =>
                                  handleOpenDisposisiSidebar(record.id)
                                }
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState />
              )
            ) : null}

            {activeKind === "surat-keluar" ? (
              isLoadingSuratKeluar ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Send className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    Memuat surat keluar
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Data laporan surat keluar sedang diambil dari server.
                  </p>
                </div>
              ) : filteredSuratKeluar.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Nama Penerima
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Alamat Penerima
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Nama / Nomor Surat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tgl Pengiriman
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Sifat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Media
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSuratKeluar.map((record, index) => (
                      <tr
                        key={record.id}
                        className="cursor-pointer bg-white hover:bg-gray-50"
                        onDoubleClick={() =>
                          setSelectedDetail({ kind: "surat-keluar", record })
                        }
                      >
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {record.penerima}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {record.alamatPenerima}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {record.namaSurat}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDisplayDate(record.tanggalKirim)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-sm font-semibold ${
                              record.sifat !== "Biasa"
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {record.sifat}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.media}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {record.statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <DeleteButton
                              onClick={() => handleDeleteSuratKeluar(record)}
                            />
                            <DetailButton
                              onClick={() =>
                                setSelectedDetail({
                                  kind: "surat-keluar",
                                  record,
                                })
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState />
              )
            ) : null}

            {activeKind === "memorandum" ? (
              isLoadingMemorandum ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <FileText className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-medium text-gray-900">
                    Memuat memorandum
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Data memorandum sedang diambil dari server.
                  </p>
                </div>
              ) : filteredMemorandum.length > 0 ? (
                <table className="w-full border-collapse text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        No Memo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Perihal
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Divisi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Pembuat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Penerima
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tanggal
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap w-36">
                        Tenggat Waktu
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap w-28">
                        Status Tenggat
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-72">
                        Keterangan Memo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-72">
                        Catatan Redisposisi
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredMemorandum.map((record, index) => (
                      <tr
                        key={record.id}
                        className="cursor-pointer bg-white hover:bg-gray-50"
                        onDoubleClick={() =>
                          setSelectedDetail({ kind: "memorandum", record })
                        }
                      >
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 text-gray-900">
                          <span className="font-semibold text-gray-900 tabular-nums">
                            {record.noMemo}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.perihal}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {record.divisiPengirim}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {record.pembuatMemo}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="line-clamp-2 text-sm text-gray-700">
                            {formatJoinedNames(record.penerima)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDisplayDate(record.tanggal)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {record.tenggatWaktu ? (
                            <span className="whitespace-nowrap text-sm text-gray-700">
                              {formatTenggatDate(record.tenggatWaktu)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const status = getTenggatStatus(
                              record.tenggatWaktu,
                              today,
                            );
                            if (status.variant === "none") {
                              return <span className="text-gray-400">—</span>;
                            }
                            if (status.variant === "overdue") {
                              return (
                                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                  <AlertTriangle
                                    className="mr-1 h-3 w-3"
                                    aria-hidden="true"
                                  />
                                  {status.label}
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2
                                  className="mr-1 h-3 w-3"
                                  aria-hidden="true"
                                />
                                {status.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="line-clamp-2 text-sm text-gray-600">
                            {record.keterangan}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {record.keteranganTenggat ? (
                            <p className="line-clamp-2 text-sm text-gray-600">
                              {record.keteranganTenggat}
                            </p>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                            <DeleteButton
                              onClick={() => handleDeleteMemorandum(record)}
                            />
                            <DetailButton
                              onClick={() =>
                                setSelectedDetail({
                                  kind: "memorandum",
                                  record,
                                })
                              }
                            />
                            <DisposisiButton
                              onClick={() =>
                                handleOpenMemorandumDisposisi(record.id)
                              }
                              isRedisposisi={
                                record.disposisi_history.length > 0
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState />
              )
            ) : null}
          </ReportSectionShell>
        )}
      </div>
      <DetailModal
        isOpen={selectedDetail !== null}
        onClose={() => setSelectedDetail(null)}
        title={
          selectedDetail?.kind === "surat-masuk"
            ? "Detail Surat Masuk"
            : selectedDetail?.kind === "surat-keluar"
              ? "Detail Surat Keluar"
              : "Detail Memorandum"
        }
      >
        {selectedDetail?.kind === "surat-masuk" ? (
          <div className="space-y-6">
            <DetailSection title="Informasi Surat">
              <DetailRow
                label="Nama Pengirim"
                value={selectedDetail.record.pengirim}
              />
              <DetailRow
                label="Alamat Pengirim"
                value={selectedDetail.record.alamatPengirim}
              />
              <DetailRow
                label="Nama / Nomor Surat"
                value={selectedDetail.record.namaSurat}
              />
              <DetailRow
                label="Perihal"
                value={selectedDetail.record.perihal}
              />
              <DetailRow
                label="Tanggal Penerimaan"
                value={formatDisplayDate(selectedDetail.record.tanggalTerima)}
              />
              <DetailRow label="Sifat" value={selectedDetail.record.sifat} />
              <DetailRow
                label="Disposisi"
                value={
                  selectedDetail.record.disposisiKepada.length > 0
                    ? selectedDetail.record.disposisiKepada.join(", ")
                    : "-"
                }
              />
              <DetailRow
                label="Tenggat Waktu"
                value={formatDetailTenggatValue(
                  selectedDetail.record.tenggatWaktu,
                )}
              />
              <DetailRow
                label="Status Surat"
                value={formatSuratMasukStatus(selectedDetail.record.status)}
              />
              <DetailRow
                label="Status Tenggat"
                value={formatDetailTenggatStatus(
                  selectedDetail.record.tenggatWaktu,
                  today,
                )}
              />
              <DetailRow
                label="Keterangan Surat"
                value={selectedDetail.record.keterangan ?? "-"}
              />
              <DetailRow
                label="Catatan Disposisi"
                value={selectedDetail.record.keteranganTenggat ?? "-"}
              />
            </DetailSection>

            <DocumentSection
              fileName={selectedDetail.record.fileName}
              hasFile={isValidFileUrl(selectedDetail.record.fileUrl)}
              onPreview={() =>
                handlePreviewDocument(
                  selectedDetail.record.fileUrl,
                  selectedDetail.record.fileName,
                )
              }
            />
          </div>
        ) : null}

        {selectedDetail?.kind === "surat-keluar" ? (
          <div className="space-y-6">
            <DetailSection title="Informasi Surat">
              <DetailRow
                label="Nama Penerima"
                value={selectedDetail.record.penerima}
              />
              <DetailRow
                label="Alamat Penerima"
                value={selectedDetail.record.alamatPenerima}
              />
              <DetailRow
                label="Nama / Nomor Surat"
                value={selectedDetail.record.namaSurat}
              />
              <DetailRow
                label="Tanggal Pengiriman"
                value={formatDisplayDate(selectedDetail.record.tanggalKirim)}
              />
              <DetailRow label="Media" value={selectedDetail.record.media} />
              <DetailRow label="Sifat" value={selectedDetail.record.sifat} />
              <DetailRow
                label="Status"
                value={selectedDetail.record.statusLabel}
              />
            </DetailSection>

            <DocumentSection
              fileName={selectedDetail.record.fileName}
              hasFile={isValidFileUrl(selectedDetail.record.fileUrl)}
              onPreview={() =>
                handlePreviewDocument(
                  selectedDetail.record.fileUrl,
                  selectedDetail.record.fileName,
                )
              }
            />
          </div>
        ) : null}

        {selectedDetail?.kind === "memorandum" ? (
          <div className="space-y-6">
            <DetailSection title="Informasi Memorandum">
              <DetailRow label="No Memo" value={selectedDetail.record.noMemo} />
              <DetailRow
                label="Perihal"
                value={selectedDetail.record.perihal}
              />
              <DetailRow
                label="Divisi"
                value={selectedDetail.record.divisiPengirim}
              />
              <DetailRow
                label="Pembuat"
                value={selectedDetail.record.pembuatMemo}
              />
              <DetailRow
                label="Penerima"
                value={formatJoinedNames(selectedDetail.record.penerima)}
              />
              <DetailRow
                label="Tanggal"
                value={formatDisplayDate(selectedDetail.record.tanggal)}
              />
              <DetailRow
                label="Tenggat Waktu"
                value={formatDetailTenggatValue(
                  selectedDetail.record.tenggatWaktu,
                )}
              />
              <DetailRow
                label="Status Tenggat"
                value={formatDetailTenggatStatus(
                  selectedDetail.record.tenggatWaktu,
                  today,
                )}
              />
              <DetailRow
                label="Keterangan Memo"
                value={selectedDetail.record.keterangan}
              />
              <DetailRow
                label="Catatan Redisposisi"
                value={selectedDetail.record.keteranganTenggat ?? "-"}
              />
            </DetailSection>

            <DocumentSection
              fileName={selectedDetail.record.fileName}
              hasFile={isValidFileUrl(selectedDetail.record.fileUrl)}
              onPreview={() =>
                handlePreviewDocument(
                  selectedDetail.record.fileUrl,
                  selectedDetail.record.fileName,
                )
              }
            />
          </div>
        ) : null}
      </DetailModal>

      <SuratMasukDisposisiModal
        surat={activeDisposisiSurat}
        isOpen={activeDisposisiSurat !== null}
        users={disposisiUsers}
        selectedUserId={selectedDisposisiUserId}
        userSearch={disposisiUserSearch}
        catatan={disposisiCatatan}
        isSubmitting={isDisposisiSubmitting}
        onChangeSelectedUser={setSelectedDisposisiUserId}
        onChangeUserSearch={setDisposisiUserSearch}
        onChangeCatatan={setDisposisiCatatan}
        onClose={handleCloseDisposisiSidebar}
        onSubmit={handleSubmitDisposisi}
      />
      <MemorandumDisposisiModal
        memorandum={activeDisposisiMemorandum}
        isOpen={activeDisposisiMemorandum !== null}
        users={disposisiUsers}
        selectedUserId={selectedMemorandumDisposisiUserId}
        userSearch={memorandumDisposisiUserSearch}
        dueDate={memorandumDisposisiDueDate}
        catatan={memorandumDisposisiCatatan}
        isSubmitting={isMemorandumDisposisiSubmitting}
        onChangeSelectedUser={setSelectedMemorandumDisposisiUserId}
        onChangeUserSearch={setMemorandumDisposisiUserSearch}
        onChangeDueDate={setMemorandumDisposisiDueDate}
        onChangeCatatan={setMemorandumDisposisiCatatan}
        onClose={handleCloseMemorandumDisposisi}
        onSubmit={handleSubmitMemorandumDisposisi}
      />
      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        title="Hapus Surat Masuk?"
        entityLabel="surat masuk"
        itemName={deleteTarget?.namaSurat ?? ""}
        onClose={() => {
          if (!isDeletingSuratMasuk) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={handleConfirmDeleteSuratMasuk}
        isLoading={isDeletingSuratMasuk}
      />
      <DeleteConfirmModal
        isOpen={deleteOutgoingTarget !== null}
        title="Hapus Surat Keluar?"
        entityLabel="surat keluar"
        itemName={deleteOutgoingTarget?.namaSurat ?? ""}
        onClose={() => {
          if (!isDeletingSuratKeluar) {
            setDeleteOutgoingTarget(null);
          }
        }}
        onConfirm={handleConfirmDeleteSuratKeluar}
        isLoading={isDeletingSuratKeluar}
      />
      <DeleteConfirmModal
        isOpen={deleteMemorandumTarget !== null}
        title="Hapus Memorandum?"
        entityLabel="memorandum"
        itemName={deleteMemorandumTarget?.noMemo ?? ""}
        onClose={() => {
          if (!isDeletingMemorandum) {
            setDeleteMemorandumTarget(null);
          }
        }}
        onConfirm={handleConfirmDeleteMemorandum}
        isLoading={isDeletingMemorandum}
      />
    </div>
  );
}
