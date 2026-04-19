"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { KeyRound, RotateCcw, Save, Search } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import UiverseCheckbox from "@/components/ui/UiverseCheckbox";
import {
  getSetupPageEmptyStateCopy,
  SETUP_PAGE_COMPACT_CELL_CLASS,
  SETUP_PAGE_COMPACT_ROW_CLASS,
  SETUP_PAGE_EMPTY_STATE_CELL_CLASS,
  SETUP_PAGE_SEARCH_CARD_CLASS,
  SETUP_PAGE_SEARCH_ICON_CLASS,
  SETUP_PAGE_SEARCH_INPUT_CLASS,
  SETUP_PAGE_SEARCH_LABEL_CLASS,
  SETUP_PAGE_SEARCH_WRAPPER_CLASS,
  SETUP_PAGE_TABLE_HEADER_CELL_CLASS,
} from "@/components/ui/setupPageStyles";
import { menuService } from "@/services/menu.service";
import {
  roleMenuService,
  type RoleMenuWritePayload,
} from "@/services/role-menu.service";
import { roleService } from "@/services/role.service";
import type { RoleRecord } from "@/types/master.types";
import type { DashboardMenuNode, RoleMenuPermission } from "@/types/rbac.types";

type FlatMenu = {
  menu: DashboardMenuNode;
  depth: number;
  rootName: string;
  ancestryIds: string[];
};

type PermKey = "can_read" | "can_create" | "can_update" | "can_delete";

type PermissionFlags = Pick<
  RoleMenuPermission,
  "can_read" | "can_create" | "can_update" | "can_delete"
>;

type PermissionMap = Record<string, PermissionFlags>;

type PermissionSupport = Record<PermKey, boolean>;

type MenuModuleKey =
  | "dashboard"
  | "arsip"
  | "surat"
  | "debitur"
  | "legal"
  | "administrator";

type MenuGroup = {
  key: string;
  label: string;
  rows: FlatMenu[];
};

const SECTION_CARD_CLASS =
  "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm";
const PERM_HEADER_CLASS =
  "w-20 px-2 py-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-gray-500";
const PERM_CELL_CLASS = "w-20 px-2 py-4 text-center align-middle";
const GROUP_ROW_CLASS = "border-y border-gray-200 bg-gray-50/80";

const MODULE_GROUPS: Array<{
  key: MenuModuleKey;
  label: string;
  rootNames: string[];
}> = [
  {
    key: "dashboard",
    label: "Dashboard",
    rootNames: ["Dashboard"],
  },
  {
    key: "arsip",
    label: "Modul penyimpanan arsip",
    rootNames: ["Arsip Digital"],
  },
  {
    key: "surat",
    label: "Modul surat menyurat",
    rootNames: ["Manajemen Surat"],
  },
  {
    key: "debitur",
    label: "Modul debitur",
    rootNames: ["Informasi Debitur"],
  },
  {
    key: "legal",
    label: "Modul legal",
    rootNames: ["Manajemen Legal"],
  },
  {
    key: "administrator",
    label: "Administrator",
    rootNames: ["Admin", "Parameter", "Manajemen User"],
  },
];

const READ_ONLY_PREFIXES = [
  "/dashboard",
  "/dashboard/arsip-digital/historis",
  "/dashboard/arsip-digital/disposisi/historis",
  "/dashboard/arsip-digital/peminjaman/laporan",
  "/dashboard/arsip-digital/ruang-arsip/jatuh-tempo",
  "/dashboard/arsip-digital/ruang-arsip/list-dokumen",
  "/dashboard/arsip-digital/ruang-arsip/tempat-penyimpanan",
  "/dashboard/manajemen-surat/laporan",
  "/dashboard/manajemen-surat/cetak-dokumen",
  "/dashboard/informasi-debitur",
  "/dashboard/legal/cetak",
  "/dashboard/legal/laporan",
];

const FULL_CRUD_PREFIXES = [
  "/dashboard/users",
  "/dashboard/arsip-digital/parameter",
  "/dashboard/legal/progress/asuransi",
  "/dashboard/legal/progress/klaim",
  "/dashboard/legal/progress/notaris",
  "/dashboard/legal/titipan/asuransi",
  "/dashboard/legal/titipan/notaris",
  "/dashboard/legal/titipan/angsuran",
];

const CREATE_ONLY_PREFIXES = [
  "/dashboard/arsip-digital/input-dokumen",
  "/dashboard/arsip-digital/disposisi/pengajuan",
  "/dashboard/arsip-digital/peminjaman/request",
  "/dashboard/manajemen-surat/kelola-surat/input-surat-masuk",
  "/dashboard/manajemen-surat/kelola-surat/input-memorandum",
  "/dashboard/informasi-debitur/admin/upload-slik",
  "/dashboard/informasi-debitur/admin/upload-restrik",
];

const CREATE_UPDATE_PREFIXES = [
  "/dashboard/informasi-debitur/marketing/action-plan",
  "/dashboard/informasi-debitur/marketing/hasil-kunjungan",
  "/dashboard/informasi-debitur/marketing/langkah-penanganan",
  "/dashboard/manajemen-surat/kelola-surat/input-surat-keluar",
];

const UPDATE_ONLY_PREFIXES = [
  "/dashboard/arsip-digital/disposisi/permintaan",
  "/dashboard/arsip-digital/peminjaman/accept",
];

const CREATE_DELETE_PREFIXES = ["/dashboard/legal/upload-ideb"];

function createEmptyPermission(): PermissionFlags {
  return {
    can_read: false,
    can_create: false,
    can_update: false,
    can_delete: false,
  };
}

function clonePermission(permission: PermissionFlags): PermissionFlags {
  return {
    can_read: permission.can_read,
    can_create: permission.can_create,
    can_update: permission.can_update,
    can_delete: permission.can_delete,
  };
}

function permissionFromRoleMenu(
  permission: RoleMenuPermission | null | undefined,
): PermissionFlags {
  return {
    can_read: permission?.can_read ?? false,
    can_create: permission?.can_create ?? false,
    can_update: permission?.can_update ?? false,
    can_delete: permission?.can_delete ?? false,
  };
}

function permissionsEqual(
  left: PermissionFlags,
  right: PermissionFlags,
): boolean {
  return (
    left.can_read === right.can_read &&
    left.can_create === right.can_create &&
    left.can_update === right.can_update &&
    left.can_delete === right.can_delete
  );
}

function flattenMenus(
  nodes: DashboardMenuNode[],
  depth = 0,
  rootName?: string,
  ancestryIds: string[] = [],
): FlatMenu[] {
  const sorted = [...nodes].sort((left, right) => left.order - right.order);
  const out: FlatMenu[] = [];

  for (const menu of sorted) {
    const nextRootName = rootName ?? menu.name;
    out.push({
      menu,
      depth,
      rootName: nextRootName,
      ancestryIds,
    });

    if (menu.children.length > 0) {
      out.push(
        ...flattenMenus(menu.children, depth + 1, nextRootName, [
          ...ancestryIds,
          menu.id,
        ]),
      );
    }
  }

  return out;
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isPermissionEmpty(permission: PermissionFlags): boolean {
  return !(
    permission.can_read ||
    permission.can_create ||
    permission.can_update ||
    permission.can_delete
  );
}

function mergeRoleMenuPermissions(
  items: RoleMenuPermission[],
): RoleMenuPermission | null {
  if (items.length === 0) return null;

  return items.reduce<RoleMenuPermission>(
    (merged, current) => ({
      ...merged,
      can_read: merged.can_read || current.can_read,
      can_create: merged.can_create || current.can_create,
      can_update: merged.can_update || current.can_update,
      can_delete: merged.can_delete || current.can_delete,
      role_name: merged.role_name ?? current.role_name,
      menu_name: merged.menu_name ?? current.menu_name,
      menu_url: merged.menu_url ?? current.menu_url,
    }),
    { ...items[0] },
  );
}

function getModuleGroupMeta(rootName: string) {
  return MODULE_GROUPS.find((group) => group.rootNames.includes(rootName));
}

function getPermissionSupport(row: FlatMenu): PermissionSupport {
  const pathname = row.menu.url;

  if (row.menu.children.length > 0) {
    return {
      can_read: true,
      can_create: false,
      can_update: false,
      can_delete: false,
    };
  }

  if (FULL_CRUD_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return {
      can_read: true,
      can_create: true,
      can_update: true,
      can_delete: true,
    };
  }

  if (
    CREATE_UPDATE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  ) {
    return {
      can_read: true,
      can_create: true,
      can_update: true,
      can_delete: false,
    };
  }

  if (
    CREATE_DELETE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))
  ) {
    return {
      can_read: true,
      can_create: true,
      can_update: false,
      can_delete: true,
    };
  }

  if (UPDATE_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return {
      can_read: true,
      can_create: false,
      can_update: true,
      can_delete: false,
    };
  }

  if (CREATE_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return {
      can_read: true,
      can_create: true,
      can_update: false,
      can_delete: false,
    };
  }

  if (READ_ONLY_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return {
      can_read: true,
      can_create: false,
      can_update: false,
      can_delete: false,
    };
  }

  return {
    can_read: true,
    can_create: false,
    can_update: false,
    can_delete: false,
  };
}

function sanitizePermission(
  permission: PermissionFlags,
  support: PermissionSupport,
): PermissionFlags {
  const next = clonePermission(permission);

  if (!support.can_read) {
    return createEmptyPermission();
  }

  if (!next.can_read) {
    return createEmptyPermission();
  }

  next.can_create = support.can_create ? next.can_create : false;
  next.can_update = support.can_update ? next.can_update : false;
  next.can_delete = support.can_delete ? next.can_delete : false;

  return next;
}

function togglePermission(
  current: PermissionFlags,
  key: PermKey,
  support: PermissionSupport,
): PermissionFlags {
  const next = clonePermission(current);

  if (key === "can_read") {
    next.can_read = !next.can_read;
    if (!next.can_read) {
      next.can_create = false;
      next.can_update = false;
      next.can_delete = false;
    }
    return sanitizePermission(next, support);
  }

  if (!support[key]) {
    return sanitizePermission(next, support);
  }

  next[key] = !next[key];
  if (next[key]) {
    next.can_read = true;
  }

  return sanitizePermission(next, support);
}

function buildPermissionDraft(
  rows: FlatMenu[],
  items: RoleMenuPermission[],
  supportByMenuId: Map<string, PermissionSupport>,
): PermissionMap {
  const grouped = new Map<string, RoleMenuPermission[]>();

  for (const permission of items) {
    const current = grouped.get(permission.menu_id) ?? [];
    current.push(permission);
    grouped.set(permission.menu_id, current);
  }

  return rows.reduce<PermissionMap>((acc, row) => {
    const merged = mergeRoleMenuPermissions(grouped.get(row.menu.id) ?? []);
    const support =
      supportByMenuId.get(row.menu.id) ?? getPermissionSupport(row);
    acc[row.menu.id] = sanitizePermission(
      permissionFromRoleMenu(merged),
      support,
    );
    return acc;
  }, {});
}

export default function SetupRoleMenuPage() {
  const { showToast } = useAppToast();
  const { refreshRbac } = useAuth();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [flatMenus, setFlatMenus] = useState<FlatMenu[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<
    RoleMenuPermission[]
  >([]);
  const [draftPermissions, setDraftPermissions] = useState<PermissionMap>({});
  const [initialPermissions, setInitialPermissions] = useState<PermissionMap>(
    {},
  );
  const [query, setQuery] = useState("");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const supportByMenuId = useMemo(
    () =>
      new Map(flatMenus.map((row) => [row.menu.id, getPermissionSupport(row)])),
    [flatMenus],
  );

  const selectedRoleName = useMemo(
    () => roles.find((role) => role.id === selectedRoleId)?.name ?? "",
    [roles, selectedRoleId],
  );

  const loadPageData = useCallback(async () => {
    setIsPageLoading(true);

    try {
      const [roleList, menuTree] = await Promise.all([
        roleService.getAll(),
        menuService.getAll(),
      ]);

      setRoles(
        [...roleList].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      setFlatMenus(flattenMenus(menuTree));
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal memuat data role-menu",
        "error",
      );
    } finally {
      setIsPageLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const applyFetchedPermissions = useCallback(
    (items: RoleMenuPermission[]) => {
      const nextDraft = buildPermissionDraft(flatMenus, items, supportByMenuId);
      setSelectedRolePermissions(items);
      setDraftPermissions(nextDraft);
      setInitialPermissions(nextDraft);
    },
    [flatMenus, supportByMenuId],
  );

  useEffect(() => {
    if (!selectedRoleId || flatMenus.length === 0) {
      setSelectedRolePermissions([]);
      setDraftPermissions({});
      setInitialPermissions({});
      return;
    }

    let ignore = false;

    async function loadPermissions() {
      setIsPermissionsLoading(true);
      try {
        const items = await roleMenuService.getByRoleId(selectedRoleId);
        if (!ignore) {
          applyFetchedPermissions(items);
        }
      } catch (error) {
        if (!ignore) {
          showToast(
            error instanceof Error
              ? error.message
              : "Gagal memuat akses menu role",
            "error",
          );
        }
      } finally {
        if (!ignore) {
          setIsPermissionsLoading(false);
        }
      }
    }

    void loadPermissions();

    return () => {
      ignore = true;
    };
  }, [applyFetchedPermissions, flatMenus.length, selectedRoleId, showToast]);

  const hasUnsavedChanges = useMemo(() => {
    return flatMenus.some((row) => {
      const current = draftPermissions[row.menu.id] ?? createEmptyPermission();
      const initial =
        initialPermissions[row.menu.id] ?? createEmptyPermission();
      return !permissionsEqual(current, initial);
    });
  }, [draftPermissions, flatMenus, initialPermissions]);

  const filteredFlat = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return flatMenus;

    const matchedIds = new Set<string>();
    const visibleIds = new Set<string>();

    for (const row of flatMenus) {
      const haystack = `${row.menu.name} ${row.menu.url}`.toLowerCase();
      if (haystack.includes(keyword)) {
        matchedIds.add(row.menu.id);
        visibleIds.add(row.menu.id);
        row.ancestryIds.forEach((ancestorId) => visibleIds.add(ancestorId));
      }
    }

    for (const row of flatMenus) {
      if (row.ancestryIds.some((ancestorId) => matchedIds.has(ancestorId))) {
        visibleIds.add(row.menu.id);
      }
    }

    return flatMenus.filter((row) => visibleIds.has(row.menu.id));
  }, [flatMenus, query]);

  const groupedMenus = useMemo(() => {
    const grouped = new Map<string, MenuGroup>();

    for (const row of filteredFlat) {
      const meta = getModuleGroupMeta(row.rootName);
      const key = meta?.key ?? `extra:${row.rootName}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.rows.push(row);
        continue;
      }

      grouped.set(key, {
        key,
        label: meta?.label ?? row.rootName,
        rows: [row],
      });
    }

    const orderedKnown = MODULE_GROUPS.map((group) =>
      grouped.get(group.key),
    ).filter((group): group is MenuGroup => Boolean(group));

    const extraGroups = Array.from(grouped.values())
      .filter((group) => !MODULE_GROUPS.some((meta) => meta.key === group.key))
      .sort((left, right) => left.label.localeCompare(right.label));

    return [...orderedKnown, ...extraGroups];
  }, [filteredFlat]);

  const isBusy =
    isPageLoading || isPermissionsLoading || isSaving || isResetting;

  const handlePermissionToggle = useCallback(
    (menuId: string, key: PermKey) => {
      if (!selectedRoleId || isBusy) return;

      const support = supportByMenuId.get(menuId);
      if (!support) return;

      setDraftPermissions((prev) => {
        const current = prev[menuId] ?? createEmptyPermission();
        return {
          ...prev,
          [menuId]: togglePermission(current, key, support),
        };
      });
    },
    [isBusy, selectedRoleId, supportByMenuId],
  );

  const handleReset = async () => {
    if (!selectedRoleId || isBusy) return;

    setIsResetting(true);
    try {
      const items = await roleMenuService.getByRoleId(selectedRoleId);
      applyFetchedPermissions(items);
      showToast("Permission direset ke data awal", "info");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal mereset permission",
        "error",
      );
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      showToast("Pilih role terlebih dahulu.", "warning");
      return;
    }

    if (!hasUnsavedChanges) {
      showToast("Belum ada perubahan yang perlu disimpan.", "info");
      return;
    }

    setIsSaving(true);

    try {
      const existingByMenuId = new Map<string, RoleMenuPermission[]>();

      for (const permission of selectedRolePermissions) {
        const current = existingByMenuId.get(permission.menu_id) ?? [];
        current.push(permission);
        existingByMenuId.set(permission.menu_id, current);
      }

      for (const row of flatMenus) {
        const support =
          supportByMenuId.get(row.menu.id) ?? getPermissionSupport(row);
        const desired = sanitizePermission(
          draftPermissions[row.menu.id] ?? createEmptyPermission(),
          support,
        );
        const existingItems = existingByMenuId.get(row.menu.id) ?? [];
        const mergedExisting = mergeRoleMenuPermissions(existingItems);
        const normalizedExisting = sanitizePermission(
          permissionFromRoleMenu(mergedExisting),
          support,
        );

        if (
          existingItems.length <= 1 &&
          permissionsEqual(normalizedExisting, desired)
        ) {
          continue;
        }

        if (isPermissionEmpty(desired)) {
          for (const item of existingItems) {
            await roleMenuService.remove(item.id);
          }
          continue;
        }

        if (existingItems.length > 0) {
          const [primaryPermission, ...duplicatePermissions] = existingItems;
          const primaryFlags = sanitizePermission(
            permissionFromRoleMenu(primaryPermission),
            support,
          );

          if (!permissionsEqual(primaryFlags, desired)) {
            await roleMenuService.update(primaryPermission.id, desired);
          }

          for (const duplicatePermission of duplicatePermissions) {
            await roleMenuService.remove(duplicatePermission.id);
          }
          continue;
        }

        const payload: RoleMenuWritePayload = {
          role_id: selectedRoleId,
          menu_id: row.menu.id,
          ...desired,
        };

        await roleMenuService.create(payload);
      }

      const refreshedPermissions =
        await roleMenuService.getByRoleId(selectedRoleId);
      applyFetchedPermissions(refreshedPermissions);
      await refreshRbac();
      showToast("Akses menu berhasil disimpan.", "success");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menyimpan akses menu",
        "error",
      );

      try {
        const refreshedPermissions =
          await roleMenuService.getByRoleId(selectedRoleId);
        applyFetchedPermissions(refreshedPermissions);
      } catch {}
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-6">
      <FeatureHeader
        title="Setup Akses Menu per Role"
        subtitle="Pilih role yang mau diatur, lalu tentukan menu mana yang boleh dibuka atau dikelola."
        icon={<KeyRound />}
        actions={null}
      />

      <div className={SETUP_PAGE_SEARCH_CARD_CLASS}>
        <label className="block text-sm font-medium text-gray-700">
          Pilih role
        </label>
        <select
          value={selectedRoleId}
          onChange={(event) => setSelectedRoleId(event.target.value)}
          className="select mt-3 max-w-md"
          disabled={isBusy}
        >
          <option value="">Pilih role yang mau diatur</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <div className={SETUP_PAGE_SEARCH_CARD_CLASS}>
        <p className={SETUP_PAGE_SEARCH_LABEL_CLASS}>Cari Menu</p>
        <div className={SETUP_PAGE_SEARCH_WRAPPER_CLASS}>
          <Search className={SETUP_PAGE_SEARCH_ICON_CLASS} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              selectedRoleId
                ? "Cari nama menu atau route..."
                : "Pilih role dulu untuk mulai mencari menu"
            }
            className={SETUP_PAGE_SEARCH_INPUT_CLASS}
            disabled={!selectedRoleId || isBusy}
          />
        </div>
      </div>

      <div className={SECTION_CARD_CLASS}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th
                  className={`${SETUP_PAGE_TABLE_HEADER_CELL_CLASS} min-w-[320px]`}
                >
                  Menu
                </th>
                <th className={PERM_HEADER_CLASS}>Baca</th>
                <th className={PERM_HEADER_CLASS}>Tambah</th>
                <th className={PERM_HEADER_CLASS}>Ubah</th>
                <th className={PERM_HEADER_CLASS}>Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isPageLoading && (
                <tr>
                  <td colSpan={5} className={SETUP_PAGE_EMPTY_STATE_CELL_CLASS}>
                    Memuat daftar menu...
                  </td>
                </tr>
              )}

              {!isPageLoading && !selectedRoleId && (
                <tr>
                  <td colSpan={5} className={SETUP_PAGE_EMPTY_STATE_CELL_CLASS}>
                    Pilih role untuk melihat permission menu.
                  </td>
                </tr>
              )}

              {!isPageLoading && selectedRoleId && isPermissionsLoading && (
                <tr>
                  <td colSpan={5} className={SETUP_PAGE_EMPTY_STATE_CELL_CLASS}>
                    Memuat akses menu untuk role terpilih...
                  </td>
                </tr>
              )}

              {!isPageLoading &&
                selectedRoleId &&
                !isPermissionsLoading &&
                groupedMenus.map((group) => {
                  return (
                    <Fragment key={group.key}>
                      <tr
                        className={`${SETUP_PAGE_COMPACT_ROW_CLASS} ${GROUP_ROW_CLASS}`}
                      >
                        <td
                          colSpan={5}
                          className={`${SETUP_PAGE_COMPACT_CELL_CLASS} text-sm font-semibold text-gray-900`}
                        >
                          {group.label}
                        </td>
                      </tr>

                      {group.rows.map((row) => {
                        const permission =
                          draftPermissions[row.menu.id] ??
                          createEmptyPermission();
                        const support =
                          supportByMenuId.get(row.menu.id) ??
                          getPermissionSupport(row);
                        const paddingLeft = 24;

                        const renderPermissionCell = (
                          key: PermKey,
                          label: string,
                        ) => {
                          const isUnsupported = !support[key];
                          const disabled =
                            isBusy ||
                            !selectedRoleId ||
                            isUnsupported ||
                            (key !== "can_read" && !permission.can_read);

                          return (
                            <td key={key} className={PERM_CELL_CLASS}>
                              <div
                                className="flex justify-center"
                                title={
                                  isUnsupported
                                    ? "Permission ini tidak tersedia untuk menu ini."
                                    : undefined
                                }
                              >
                                <UiverseCheckbox
                                  checked={permission[key]}
                                  onCheckedChange={() =>
                                    handlePermissionToggle(row.menu.id, key)
                                  }
                                  disabled={disabled}
                                  ariaLabel={`${row.menu.name} - ${label}`}
                                  size={20}
                                  className={
                                    isUnsupported
                                      ? "uiverse-checkbox--unavailable"
                                      : undefined
                                  }
                                />
                              </div>
                            </td>
                          );
                        };

                        return (
                          <tr
                            key={row.menu.id}
                            className={SETUP_PAGE_COMPACT_ROW_CLASS}
                          >
                            <td
                              className={`${SETUP_PAGE_COMPACT_CELL_CLASS} text-sm text-gray-900`}
                              style={{ paddingLeft }}
                            >
                              <div className="flex items-center gap-3">
                                <p className="font-medium text-gray-900">
                                  {row.menu.name}
                                </p>
                              </div>
                            </td>
                            {renderPermissionCell("can_read", "Baca")}
                            {renderPermissionCell("can_create", "Tambah")}
                            {renderPermissionCell("can_update", "Ubah")}
                            {renderPermissionCell("can_delete", "Hapus")}
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}

              {!isPageLoading &&
                selectedRoleId &&
                !isPermissionsLoading &&
                groupedMenus.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className={SETUP_PAGE_EMPTY_STATE_CELL_CLASS}
                    >
                      {getSetupPageEmptyStateCopy("menu")}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!selectedRoleId || isBusy}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <div
                    className="button-spinner"
                    style={
                      {
                        ["--spinner-size"]: "18px",
                        ["--spinner-border"]: "2px",
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>Simpan perubahan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={!selectedRoleId || isBusy}
              className="btn btn-outline"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
