import type { DashboardMenuNode, RoleMenuPermission } from "@/types/rbac.types";

export const RBAC_DENIED_MESSAGE = "Maaf, Anda tidak bisa mengakses fitur ini.";

export const ROLES = {
  MANAJER: "Manajer",
  ADMIN: "Admin",
  LEGAL: "Legal",
  IT: "IT",
} as const;

export type CanonicalRole = (typeof ROLES)[keyof typeof ROLES];
export type Role = string;
export type PermissionCapability = "read" | "create" | "update" | "delete";

export const ROLE_LABELS: Record<CanonicalRole, string> = {
  [ROLES.MANAJER]: ROLES.MANAJER,
  [ROLES.ADMIN]: ROLES.ADMIN,
  [ROLES.LEGAL]: ROLES.LEGAL,
  [ROLES.IT]: ROLES.IT,
};

export type DataAccessLevel = "RESTRICT" | "NON_RESTRICT";

type RouteRule = {
  prefix: string;
  label: string;
  roles: readonly CanonicalRole[];
};

type FlattenedMenuNode = DashboardMenuNode & {
  depth: number;
  ancestryIds: string[];
};

type RuntimeRbacState = {
  flatMenus: FlattenedMenuNode[];
  permissionsByRoleId: Map<string, Map<string, RoleMenuPermission>>;
  readableRolesByMenuId: Map<string, Set<Role>>;
};

const ALL_ROLES: readonly CanonicalRole[] = [
  ROLES.MANAJER,
  ROLES.ADMIN,
  ROLES.LEGAL,
  ROLES.IT,
];

const LEGACY_DASHBOARD_ROUTE_RULES: readonly RouteRule[] = [
  {
    prefix: "/dashboard/informasi-debitur/admin",
    label: "Admin",
    roles: [ROLES.ADMIN, ROLES.IT],
  },
  {
    prefix: "/dashboard/legal/upload-ideb",
    label: "Upload IDEB",
    roles: [ROLES.LEGAL, ROLES.IT],
  },
  {
    prefix: "/dashboard/legal/laporan",
    label: "Laporan Legal",
    roles: [ROLES.MANAJER, ROLES.LEGAL, ROLES.IT],
  },
  {
    prefix: "/dashboard/legal/cetak",
    label: "Cetak Dok Legal",
    roles: [ROLES.LEGAL, ROLES.IT],
  },
  {
    prefix: "/dashboard/legal/titipan",
    label: "Dana Titipan",
    roles: [ROLES.LEGAL],
  },
  {
    prefix: "/dashboard/legal/progress",
    label: "Input Progress PHK3",
    roles: [ROLES.LEGAL],
  },
  {
    prefix: "/dashboard/legal",
    label: "Legal",
    roles: [ROLES.MANAJER, ROLES.LEGAL, ROLES.IT],
  },
  {
    prefix: "/dashboard/manajemen-surat/kelola-surat/input-surat-masuk",
    label: "Input Surat Masuk",
    roles: [ROLES.ADMIN],
  },
  {
    prefix: "/dashboard/manajemen-surat/kelola-surat/input-surat-keluar",
    label: "Input Surat Keluar",
    roles: [ROLES.ADMIN],
  },
  {
    prefix: "/dashboard/manajemen-surat/kelola-surat/input-memorandum",
    label: "Input Memorandum",
    roles: [ROLES.ADMIN],
  },
  {
    prefix: "/dashboard/manajemen-surat/laporan",
    label: "Laporan",
    roles: ALL_ROLES,
  },
  {
    prefix: "/dashboard/manajemen-surat/cetak-dokumen",
    label: "Cetak Dokumen",
    roles: ALL_ROLES,
  },
  {
    prefix: "/dashboard/informasi-debitur/marketing",
    label: "Input Progress",
    roles: [ROLES.ADMIN],
  },
  {
    prefix: "/dashboard/informasi-debitur",
    label: "List Debitur",
    roles: ALL_ROLES,
  },
  {
    prefix: "/dashboard/arsip-digital/disposisi/historis",
    label: "Historis",
    roles: ALL_ROLES,
  },
  {
    prefix: "/dashboard/arsip-digital/disposisi",
    label: "Disposisi Dokumen",
    roles: [ROLES.MANAJER, ROLES.ADMIN, ROLES.LEGAL],
  },
  {
    prefix: "/dashboard/arsip-digital/peminjaman/laporan",
    label: "Laporan Arsip",
    roles: ALL_ROLES,
  },
  {
    prefix: "/dashboard/arsip-digital/peminjaman/request",
    label: "Peminjaman Dokumen",
    roles: [ROLES.ADMIN, ROLES.LEGAL],
  },
  {
    prefix: "/dashboard/arsip-digital/peminjaman/accept",
    label: "Peminjaman Dokumen",
    roles: [ROLES.ADMIN, ROLES.LEGAL],
  },
  {
    prefix: "/dashboard/arsip-digital/historis",
    label: "Historis",
    roles: ALL_ROLES,
  },
  {
    prefix: "/dashboard/arsip-digital/input-dokumen",
    label: "Penyimpanan Arsip",
    roles: [ROLES.ADMIN, ROLES.LEGAL],
  },
  {
    prefix: "/dashboard/arsip-digital/ruang-arsip",
    label: "Penyimpanan Arsip",
    roles: [ROLES.ADMIN, ROLES.LEGAL],
  },
];

let runtimeRbacState: RuntimeRbacState | null = null;

function matchesPath(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function hasRole(role: Role, roles: readonly CanonicalRole[]) {
  const appRole = mapRoleLikeToAppRole(role);
  return appRole ? roles.includes(appRole) : false;
}

export function normalizePath(pathname: string): string {
  const [withoutHash] = pathname.split("#");
  const [withoutQuery] = withoutHash.split("?");
  if (!withoutQuery || withoutQuery === "/") return withoutQuery || "/";
  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
}

export const ADMINISTRATOR_SECTION_ROOT_NAMES = new Set([
  "Admin",
  "Parameter",
  "Manajemen User",
]);

export function getRoleLabel(role: Role | null | undefined): string {
  if (!role) return "-";

  const appRole = mapRoleLikeToAppRole(role);
  if (appRole) {
    return ROLE_LABELS[appRole];
  }

  const trimmed = role.trim();
  return trimmed.length > 0 ? trimmed : "-";
}

export function filterMenuTreeForRoleRead(
  roleId: string | undefined,
  menus: DashboardMenuNode[],
): DashboardMenuNode[] {
  if (!roleId || !runtimeRbacState) return [];

  const perms = runtimeRbacState.permissionsByRoleId.get(roleId);
  if (!perms) return [];

  const canRead = (menuId: string) => perms.get(menuId)?.can_read === true;

  function walk(nodes: DashboardMenuNode[]): DashboardMenuNode[] {
    const sorted = [...nodes].sort((a, b) => a.order - b.order);
    const out: DashboardMenuNode[] = [];

    for (const node of sorted) {
      const childFiltered = walk(node.children);
      if (canRead(node.id) || childFiltered.length > 0) {
        out.push({ ...node, children: childFiltered });
      }
    }

    return out;
  }

  return walk(menus);
}

export function getMenuIdsToExpandForPath(
  menus: DashboardMenuNode[],
  pathname: string,
): string[] {
  const norm = normalizePath(pathname);
  let bestUrlLen = -1;
  let bestAncestors: string[] = [];

  function visit(nodes: DashboardMenuNode[], ancestors: string[]) {
    for (const n of nodes) {
      const nu = normalizePath(n.url);
      if (nu && nu !== "/" && (norm === nu || norm.startsWith(`${nu}/`))) {
        if (nu.length > bestUrlLen) {
          bestUrlLen = nu.length;
          bestAncestors = ancestors;
        }
      }
      if (n.children.length > 0) {
        visit(n.children, [...ancestors, n.id]);
      }
    }
  }

  visit(menus, []);
  return bestAncestors;
}

export function isNodeOrDescendantPathActive(
  node: DashboardMenuNode,
  pathname: string,
): boolean {
  const norm = normalizePath(pathname);
  const nu = normalizePath(node.url);
  if (nu && (norm === nu || norm.startsWith(`${nu}/`))) return true;
  return node.children.some((c) => isNodeOrDescendantPathActive(c, pathname));
}

function flattenMenuTree(
  menus: DashboardMenuNode[],
  depth = 0,
  ancestryIds: string[] = [],
): FlattenedMenuNode[] {
  return menus.flatMap((menu) => {
    const nextNode: FlattenedMenuNode = {
      ...menu,
      depth,
      ancestryIds,
    };

    return [
      nextNode,
      ...flattenMenuTree(menu.children, depth + 1, [...ancestryIds, menu.id]),
    ];
  });
}

function mergePermissionEntries(
  existing: RoleMenuPermission | undefined,
  next: RoleMenuPermission,
): RoleMenuPermission {
  if (!existing) return next;

  return {
    ...existing,
    can_create: existing.can_create || next.can_create,
    can_read: existing.can_read || next.can_read,
    can_update: existing.can_update || next.can_update,
    can_delete: existing.can_delete || next.can_delete,
    role_name: existing.role_name ?? next.role_name,
    menu_name: existing.menu_name ?? next.menu_name,
    menu_url: existing.menu_url ?? next.menu_url,
  };
}

function getCapabilityFlag(
  permission: RoleMenuPermission | undefined,
  capability: PermissionCapability,
): boolean {
  if (!permission) return false;

  switch (capability) {
    case "create":
      return permission.can_create;
    case "update":
      return permission.can_update;
    case "delete":
      return permission.can_delete;
    case "read":
    default:
      return permission.can_read;
  }
}

function getAllowedRolesForMenus(menuIds: string[]): readonly Role[] {
  if (!runtimeRbacState) return [];

  const allowedRoles = new Set<Role>();

  for (const menuId of menuIds) {
    const roles = runtimeRbacState.readableRolesByMenuId.get(menuId);
    roles?.forEach((role) => allowedRoles.add(role));
  }

  return Array.from(allowedRoles);
}

function getBestMatchingMenus(pathname: string): FlattenedMenuNode[] {
  if (!runtimeRbacState) return [];

  const normalizedPath = normalizePath(pathname);
  const matchingMenus = runtimeRbacState.flatMenus.filter(
    (menu) => menu.url && matchesPath(normalizedPath, normalizePath(menu.url)),
  );

  if (matchingMenus.length === 0) return [];

  const maxUrlLength = matchingMenus.reduce(
    (max, menu) => Math.max(max, menu.url.length),
    0,
  );

  return matchingMenus.filter((menu) => menu.url.length === maxUrlLength);
}

function getRuntimeCapability(
  pathname: string,
  roleId: string | null | undefined,
  capability: PermissionCapability,
): boolean | null {
  if (!runtimeRbacState) return null;

  const matchingMenus = getBestMatchingMenus(pathname);
  if (matchingMenus.length === 0) return null;
  if (!roleId) return null;

  const rolePermissions = runtimeRbacState.permissionsByRoleId.get(roleId);
  if (!rolePermissions) return false;

  return matchingMenus.some((menu) =>
    getCapabilityFlag(rolePermissions.get(menu.id), capability),
  );
}

function getRuntimeRouteDecision(
  pathname: string,
  _role: Role | null | undefined,
  roleId: string | null | undefined,
): RouteAccessDecision | null {
  if (!runtimeRbacState) return null;

  if (pathname === "/dashboard" && roleId) {
    return allow();
  }

  const matchingMenus = getBestMatchingMenus(pathname);
  if (matchingMenus.length === 0) return null;
  if (!roleId) return deny("AUTH_REQUIRED");

  const hasReadAccess = getRuntimeCapability(pathname, roleId, "read");
  if (hasReadAccess) {
    return allow();
  }

  const label =
    matchingMenus.length === 1
      ? matchingMenus[0].name
      : matchingMenus.map((menu) => menu.name).join(" / ");

  return {
    allowed: false,
    reason: "ROLE_REQUIRED",
    label,
    allowedRoles: getAllowedRolesForMenus(matchingMenus.map((menu) => menu.id)),
  };
}

function getLegacyCapability(
  pathname: string,
  role: Role | null | undefined,
  capability: PermissionCapability,
): boolean {
  if (!role) return false;
  if (!getLegacyDashboardRouteDecision(pathname, role).allowed) return false;

  const normalizedPath = normalizePath(pathname);

  if (capability === "read") return true;

  if (matchesPath(normalizedPath, "/dashboard/legal/upload-ideb")) {
    if (capability === "delete") {
      return hasRole(role, [ROLES.LEGAL, ROLES.IT]);
    }

    return hasRole(role, [ROLES.LEGAL, ROLES.IT]);
  }

  if (
    matchesPath(
      normalizedPath,
      "/dashboard/arsip-digital/disposisi/permintaan",
    ) ||
    matchesPath(normalizedPath, "/dashboard/arsip-digital/peminjaman/accept") ||
    matchesPath(normalizedPath, "/dashboard/manajemen-surat/laporan")
  ) {
    return capability === "update";
  }

  if (
    matchesPath(
      normalizedPath,
      "/dashboard/arsip-digital/disposisi/pengajuan",
    ) ||
    matchesPath(
      normalizedPath,
      "/dashboard/arsip-digital/peminjaman/request",
    ) ||
    matchesPath(
      normalizedPath,
      "/dashboard/manajemen-surat/kelola-surat/input-surat-masuk",
    ) ||
    matchesPath(
      normalizedPath,
      "/dashboard/manajemen-surat/kelola-surat/input-surat-keluar",
    ) ||
    matchesPath(
      normalizedPath,
      "/dashboard/manajemen-surat/kelola-surat/input-memorandum",
    )
  ) {
    return capability === "create";
  }

  if (matchesPath(normalizedPath, "/dashboard/informasi-debitur/marketing")) {
    return capability === "create" || capability === "update";
  }

  return false;
}

export function isCanonicalRole(value: unknown): value is CanonicalRole {
  return (
    typeof value === "string" &&
    (Object.values(ROLES) as readonly string[]).includes(value)
  );
}

const ROLE_BY_NORMALIZED: Record<string, CanonicalRole> = {
  manajer: ROLES.MANAJER,
  admin: ROLES.ADMIN,
  legal: ROLES.LEGAL,
  it: ROLES.IT,
};

export function mapRoleLikeToAppRole(value: unknown): CanonicalRole | null {
  if (isCanonicalRole(value)) return value;

  if (typeof value === "string") {
    const key = value
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
    return ROLE_BY_NORMALIZED[key] ?? null;
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return (
      mapRoleLikeToAppRole(record.role) ??
      mapRoleLikeToAppRole(record.role_name) ??
      mapRoleLikeToAppRole(record.roleName) ??
      mapRoleLikeToAppRole(record.name) ??
      mapRoleLikeToAppRole(record.label) ??
      mapRoleLikeToAppRole(record.code)
    );
  }

  return null;
}

export function setRuntimeRbacData(payload: {
  menus: DashboardMenuNode[];
  roleMenus: RoleMenuPermission[];
}) {
  const flatMenus = flattenMenuTree(payload.menus).sort((left, right) => {
    if (right.url.length !== left.url.length) {
      return right.url.length - left.url.length;
    }

    return left.depth - right.depth;
  });

  const permissionsByRoleId = new Map<
    string,
    Map<string, RoleMenuPermission>
  >();
  const readableRolesByMenuId = new Map<string, Set<Role>>();

  payload.roleMenus.forEach((permission) => {
    const rolePermissions =
      permissionsByRoleId.get(permission.role_id) ??
      new Map<string, RoleMenuPermission>();
    const mergedPermission = mergePermissionEntries(
      rolePermissions.get(permission.menu_id),
      permission,
    );

    rolePermissions.set(permission.menu_id, mergedPermission);
    permissionsByRoleId.set(permission.role_id, rolePermissions);

    if (mergedPermission.can_read) {
      const allowedRoleLabel =
        permission.role_name?.trim() ||
        mapRoleLikeToAppRole(permission.role_name) ||
        null;
      if (allowedRoleLabel) {
        const allowedRoles =
          readableRolesByMenuId.get(permission.menu_id) ?? new Set<Role>();
        allowedRoles.add(allowedRoleLabel);
        readableRolesByMenuId.set(permission.menu_id, allowedRoles);
      }
    }
  });

  runtimeRbacState = {
    flatMenus,
    permissionsByRoleId,
    readableRolesByMenuId,
  };
}

export function clearRuntimeRbacData() {
  runtimeRbacState = null;
}

export function filterDigitalDocuments<
  T extends { levelAkses: DataAccessLevel },
>(isRestrict: boolean, documents: T[]): T[] {
  return documents.filter(
    (document) => document.levelAkses === "NON_RESTRICT" || isRestrict,
  );
}

export function canManageDisposisi(role: Role): boolean {
  return hasRole(role, [ROLES.MANAJER, ROLES.ADMIN, ROLES.LEGAL]);
}

export interface RouteAccessDecision {
  allowed: boolean;
  reason:
    | "ALLOWED"
    | "AUTH_REQUIRED"
    | "ROLE_REQUIRED"
    | "UNKNOWN_ROUTE_DENIED";
  label?: string;
  allowedRoles?: readonly Role[];
}

function allow(): RouteAccessDecision {
  return { allowed: true, reason: "ALLOWED" };
}

function denyRoleAccess(rule: RouteRule): RouteAccessDecision {
  return {
    allowed: false,
    reason: "ROLE_REQUIRED",
    label: rule.label,
    allowedRoles: rule.roles,
  };
}

function deny(reason: RouteAccessDecision["reason"]): RouteAccessDecision {
  return { allowed: false, reason };
}

function getLegacyDashboardRouteDecision(
  pathname: string,
  role: Role | null | undefined,
): RouteAccessDecision {
  if (!role) return deny("AUTH_REQUIRED");

  if (pathname === "/dashboard") return allow();

  const matchedRule = LEGACY_DASHBOARD_ROUTE_RULES.find((rule) =>
    matchesPath(pathname, rule.prefix),
  );

  if (matchedRule) {
    return hasRole(role, matchedRule.roles)
      ? allow()
      : denyRoleAccess(matchedRule);
  }

  if (pathname.startsWith("/dashboard")) {
    return deny("UNKNOWN_ROUTE_DENIED");
  }

  return deny("UNKNOWN_ROUTE_DENIED");
}

export function getDashboardRouteDecision(
  pathname: string,
  role: Role | null | undefined,
  roleId?: string | null,
): RouteAccessDecision {
  const normalizedPath = normalizePath(pathname);
  const runtimeDecision = getRuntimeRouteDecision(normalizedPath, role, roleId);
  if (runtimeDecision) return runtimeDecision;
  return getLegacyDashboardRouteDecision(normalizedPath, role);
}

export function hasDashboardCapability(
  pathname: string,
  role: Role | null | undefined,
  roleId: string | null | undefined,
  capability: PermissionCapability,
): boolean {
  const normalizedPath = normalizePath(pathname);
  const runtimeCapability = getRuntimeCapability(
    normalizedPath,
    roleId,
    capability,
  );

  if (runtimeCapability !== null) {
    return runtimeCapability;
  }

  return getLegacyCapability(normalizedPath, role, capability);
}
