"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Save, Search, Trash2, Users, X } from "lucide-react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAppToast } from "@/components/ui/AppToastProvider";
import FeatureHeader from "@/components/ui/FeatureHeader";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import UiverseCheckbox from "@/components/ui/UiverseCheckbox";
import { useProtectedAction } from "@/hooks/useProtectedAction";
import {
  RBAC_DENIED_MESSAGE,
  getDashboardRouteDecision,
  ROLES,
  mapRoleLikeToAppRole,
  type Role,
} from "@/lib/rbac";
import {
  SETUP_PAGE_ADD_BUTTON_CLASS,
  SETUP_PAGE_ACTION_CELL_CLASS,
  SETUP_PAGE_ACTION_HEADER_CELL_CLASS,
  SETUP_PAGE_EMPTY_STATE_CELL_CLASS,
  SETUP_PAGE_NUMBER_CELL_CLASS,
  SETUP_PAGE_NUMBER_HEADER_CELL_CLASS,
  SETUP_PAGE_SEARCH_CARD_CLASS,
  SETUP_PAGE_SEARCH_ICON_CLASS,
  SETUP_PAGE_SEARCH_INPUT_CLASS,
  SETUP_PAGE_SEARCH_LABEL_CLASS,
  SETUP_PAGE_SEARCH_WRAPPER_CLASS,
  SETUP_PAGE_TABLE_CELL_CLASS,
  SETUP_PAGE_TABLE_HEADER_CELL_CLASS,
  SETUP_PAGE_TABLE_ROW_CLASS,
} from "@/components/ui/setupPageStyles";
import { divisionService } from "@/services/division.service";
import { roleService } from "@/services/role.service";
import { userService } from "@/services/user.service";
import type { UserPayload, UserRecord } from "@/types/auth.types";
import type { Division, RoleRecord } from "@/types/master.types";

type UserFormState = {
  name: string;
  username: string;
  email: string;
  phone: string;
  division_id: string;
  role_id: string;
  is_restrict: boolean;
  is_active: boolean;
  password: string;
};

const EMPTY_FORM: UserFormState = {
  name: "",
  username: "",
  email: "",
  phone: "",
  division_id: "",
  role_id: "",
  is_restrict: false,
  is_active: true,
  password: "",
};
const PILL_BASE_CLASS =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";
const ACTION_ICON_BUTTON_CLASS =
  "rounded-lg p-2 transition-colors";
const MIN_USER_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeTextInput(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

function getRolePillClass(role: Role | null) {
  switch (role) {
    case ROLES.IT:
      return `${PILL_BASE_CLASS} border-rose-200 bg-rose-50 text-rose-600`;
    case ROLES.ADMIN:
      return `${PILL_BASE_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700`;
    case ROLES.LEGAL:
      return `${PILL_BASE_CLASS} border-sky-200 bg-sky-50 text-sky-700`;
    case ROLES.MANAJER:
      return `${PILL_BASE_CLASS} border-amber-200 bg-amber-50 text-amber-700`;
    default:
      return `${PILL_BASE_CLASS} border-gray-200 bg-gray-100 text-gray-700`;
  }
}

function getBooleanPillClass(isEnabled: boolean) {
  return isEnabled
    ? `${PILL_BASE_CLASS} border-emerald-200 bg-emerald-50 text-emerald-700`
    : `${PILL_BASE_CLASS} border-gray-200 bg-gray-100 text-gray-700`;
}

export default function ManajemenUserPage() {
  const router = useRouter();
  const { role, user: authUser } = useAuth();
  const { showToast } = useAppToast();
  const { ensureCapability, hasCapability } = useProtectedAction();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState<UserFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const usersRouteDecision = useMemo(
    () => getDashboardRouteDecision("/dashboard/users", role, authUser?.role_id),
    [authUser?.role_id, role],
  );
  const canReadUsers = usersRouteDecision.allowed;
  const canCreateUsers = hasCapability("/dashboard/users", "create");
  const canUpdateUsers = hasCapability("/dashboard/users", "update");
  const canDeleteUsers = hasCapability("/dashboard/users", "delete");

  const roleNameById = useMemo(
    () => new Map(roles.map((item) => [item.id, item.name])),
    [roles],
  );
  const divisionNameById = useMemo(
    () => new Map(divisions.map((item) => [item.id, item.name])),
    [divisions],
  );

  const getResolvedRoleName = useCallback(
    (user: UserRecord) => user.role_name ?? roleNameById.get(user.role_id) ?? user.role_id,
    [roleNameById],
  );
  const getResolvedDivisionName = useCallback(
    (user: UserRecord) =>
      user.division_name ?? divisionNameById.get(user.division_id) ?? user.division_id,
    [divisionNameById],
  );
  const getResolvedAppRole = useCallback(
    (user: UserRecord) => mapRoleLikeToAppRole(getResolvedRoleName(user)),
    [getResolvedRoleName],
  );

  const loadData = useCallback(async () => {
    setIsFetching(true);

    try {
      const [userList, divisionList, roleList] = await Promise.all([
        userService.getAll(),
        divisionService.getAll(),
        roleService.getAll(),
      ]);

      setUsers(userList);
      setDivisions(divisionList);
      setRoles(roleList);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal memuat data user",
        "error",
      );
    } finally {
      setIsFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (!role) return;
    if (usersRouteDecision.allowed) {
      void loadData();
      return;
    }

    showToast(RBAC_DENIED_MESSAGE, "warning");
    router.replace("/dashboard");
  }, [loadData, role, router, showToast, usersRouteDecision.allowed]);

  const superAdminCount = useMemo(
    () =>
      users.filter((user) => getResolvedAppRole(user) === ROLES.IT)
        .length,
    [getResolvedAppRole, users],
  );

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) => {
      const resolvedRoleName = getResolvedRoleName(user).toLowerCase();
      const resolvedDivisionName = getResolvedDivisionName(user).toLowerCase();

      return (
        user.name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone ?? user.phone_number ?? "").toLowerCase().includes(term) ||
        resolvedDivisionName.includes(term) ||
        resolvedRoleName.includes(term)
      );
    });
  }, [getResolvedDivisionName, getResolvedRoleName, searchTerm, users]);

  const requireCreateUserAction = () =>
    ensureCapability("/dashboard/users", "create", {
      redirectTo: "/dashboard",
    });

  const requireUpdateUserAction = () =>
    ensureCapability("/dashboard/users", "update", {
      redirectTo: "/dashboard",
    });

  const requireDeleteUserAction = () =>
    ensureCapability("/dashboard/users", "delete", {
      redirectTo: "/dashboard",
    });

  const resetForm = () => setFormData(EMPTY_FORM);

  const handleAdd = () => {
    if (!requireCreateUserAction()) return;
    setEditUser(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (user: UserRecord) => {
    if (!requireUpdateUserAction()) return;

    setEditUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone ?? user.phone_number ?? "",
      division_id: user.division_id,
      role_id: user.role_id,
      is_restrict: user.is_restrict,
      is_active: user.is_active,
      password: "",
    });
    setShowModal(true);
  };

  const handleDelete = (user: UserRecord) => {
    if (!requireDeleteUserAction()) return;

    if (
      getResolvedAppRole(user) === ROLES.IT &&
      superAdminCount <= 1
    ) {
      showToast("Tidak bisa menghapus user IT terakhir.", "warning");
      return;
    }

    setDeleteUser(user);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!requireDeleteUserAction()) return;
    if (!deleteUser) return;

    try {
      await userService.remove(deleteUser.id);
      setUsers((prev) => prev.filter((user) => user.id !== deleteUser.id));
      showToast("User berhasil dihapus!", "success");
      setShowDelete(false);
      setDeleteUser(null);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menghapus user",
        "error",
      );
    }
  };

  const handleSubmit = async () => {
    if (editUser) {
      if (!requireUpdateUserAction()) return;
    } else if (!requireCreateUserAction()) {
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.division_id ||
      !formData.role_id
    ) {
      showToast("Mohon lengkapi semua field yang diperlukan", "warning");
      return;
    }

    if (!editUser && !formData.password) {
      showToast("Password wajib diisi untuk user baru", "warning");
      return;
    }

    const normalizedUsername = formData.username.trim().toLowerCase();
    const normalizedEmail = formData.email.trim().toLowerCase();
    const hasPasswordInput = formData.password.length > 0;

    if (!isValidEmail(normalizedEmail)) {
      showToast("Format email belum valid.", "warning");
      return;
    }

    const duplicateUsername = users.some(
      (user) =>
        user.id !== editUser?.id &&
        user.username.trim().toLowerCase() === normalizedUsername,
    );

    if (duplicateUsername) {
      showToast("Username sudah digunakan.", "warning");
      return;
    }

    const duplicateEmail = users.some(
      (user) =>
        user.id !== editUser?.id &&
        user.email.trim().toLowerCase() === normalizedEmail,
    );

    if (duplicateEmail) {
      showToast("Email sudah digunakan.", "warning");
      return;
    }

    if (hasPasswordInput && !/\S/.test(formData.password)) {
      showToast("Password tidak boleh hanya berisi spasi.", "warning");
      return;
    }

    if (
      hasPasswordInput &&
      formData.password.length < MIN_USER_PASSWORD_LENGTH
    ) {
      showToast(
        `Password minimal ${MIN_USER_PASSWORD_LENGTH} karakter.`,
        "warning",
      );
      return;
    }

    const nextAppRole = mapRoleLikeToAppRole(roleNameById.get(formData.role_id));
    if (
      editUser &&
      getResolvedAppRole(editUser) === ROLES.IT &&
      nextAppRole !== ROLES.IT &&
      superAdminCount <= 1
    ) {
      showToast("Tidak bisa mengubah role IT terakhir.", "warning");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: UserPayload = {
        name: normalizeTextInput(formData.name),
        username: normalizedUsername,
        email: normalizedEmail,
        phone: formData.phone.trim() || undefined,
        is_active: formData.is_active,
        is_restrict: formData.is_restrict,
        role_id: formData.role_id,
        division_id: formData.division_id,
        ...(hasPasswordInput ? { password: formData.password } : {}),
      };

      const savedUser = editUser
        ? await userService.update(editUser.id, payload)
        : await userService.create(payload);

      const nextUser: UserRecord = {
        ...savedUser,
        role_name: roleNameById.get(payload.role_id),
        division_name: divisionNameById.get(payload.division_id),
      };

      setUsers((prev) => {
        if (editUser) {
          return prev.map((user) => (user.id === editUser.id ? nextUser : user));
        }
        return [...prev, nextUser];
      });

      showToast(
        editUser ? "User berhasil diupdate!" : "User berhasil ditambahkan!",
        "success",
      );

      setShowModal(false);
      setEditUser(null);
      resetForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Gagal menyimpan user",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canReadUsers) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <FeatureHeader
        title="Manajemen User"
        subtitle="Kelola pengguna, role, dan akses sistem"
        icon={<Users />}
        actions={
          <button
            onClick={handleAdd}
            className={`${SETUP_PAGE_ADD_BUTTON_CLASS} w-full lg:w-auto`}
            disabled={isFetching || roles.length === 0 || !canCreateUsers}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah User</span>
          </button>
        }
      />

      <div className={SETUP_PAGE_SEARCH_CARD_CLASS}>
        <p className={SETUP_PAGE_SEARCH_LABEL_CLASS}>Cari Data</p>
        <div className={SETUP_PAGE_SEARCH_WRAPPER_CLASS}>
          <Search
            className={SETUP_PAGE_SEARCH_ICON_CLASS}
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari berdasarkan nama, username, email, no. handphone, divisi, atau role..."
            className={SETUP_PAGE_SEARCH_INPUT_CLASS}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={SETUP_PAGE_NUMBER_HEADER_CELL_CLASS}>
                  No
                </th>
                <th className={SETUP_PAGE_TABLE_HEADER_CELL_CLASS}>
                  Nama
                </th>
                <th className={SETUP_PAGE_TABLE_HEADER_CELL_CLASS}>
                  Username
                </th>
                <th className={SETUP_PAGE_TABLE_HEADER_CELL_CLASS}>
                  Email
                </th>
                <th className={SETUP_PAGE_TABLE_HEADER_CELL_CLASS}>
                  No. Handphone
                </th>
                <th className={SETUP_PAGE_TABLE_HEADER_CELL_CLASS}>
                  Divisi
                </th>
                <th
                  className={`${SETUP_PAGE_TABLE_HEADER_CELL_CLASS} w-36 text-center`}
                >
                  Role
                </th>
                <th
                  className={`${SETUP_PAGE_TABLE_HEADER_CELL_CLASS} w-36 text-center`}
                >
                  Akses Restrict
                </th>
                <th
                  className={`${SETUP_PAGE_TABLE_HEADER_CELL_CLASS} w-32 text-center`}
                >
                  Status
                </th>
                <th className={SETUP_PAGE_ACTION_HEADER_CELL_CLASS}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user, index) => {
                const resolvedRole = getResolvedAppRole(user);
                const resolvedRoleName = getResolvedRoleName(user);
                const resolvedDivisionName = getResolvedDivisionName(user);

                return (
                  <tr key={user.id} className={SETUP_PAGE_TABLE_ROW_CLASS}>
                    <td className={SETUP_PAGE_NUMBER_CELL_CLASS}>
                      {index + 1}
                    </td>
                    <td
                      className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-sm font-semibold text-gray-900`}
                    >
                      {user.name}
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-sm text-gray-900`}>
                      {user.username}
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-sm text-gray-700`}>
                      {user.email}
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-sm text-gray-700`}>
                      {user.phone ?? user.phone_number ?? "-"}
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-sm text-gray-700`}>
                      {resolvedDivisionName}
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-center`}>
                      <span className={getRolePillClass(resolvedRole)}>
                        {resolvedRoleName}
                      </span>
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-center`}>
                      <span className={getBooleanPillClass(user.is_restrict)}>
                        {user.is_restrict ? "Ya" : "Tidak"}
                      </span>
                    </td>
                    <td className={`${SETUP_PAGE_TABLE_CELL_CLASS} text-center`}>
                      <span className={getBooleanPillClass(user.is_active)}>
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className={SETUP_PAGE_ACTION_CELL_CLASS}>
                      <div className="flex items-center justify-center gap-2">
                        {canUpdateUsers ? (
                          <button
                            onClick={() => handleEdit(user)}
                            className={`${ACTION_ICON_BUTTON_CLASS} text-blue-600 hover:bg-blue-50 hover:text-blue-700`}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                        ) : null}
                        {canDeleteUsers ? (
                          <button
                            onClick={() => handleDelete(user)}
                            className={`${ACTION_ICON_BUTTON_CLASS} text-red-600 hover:bg-red-50 hover:text-red-700`}
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isFetching && filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className={SETUP_PAGE_EMPTY_STATE_CELL_CLASS}
                  >
                    Tidak ada user yang cocok.
                  </td>
                </tr>
              )}
              {isFetching && (
                <tr>
                  <td
                    colSpan={10}
                    className={SETUP_PAGE_EMPTY_STATE_CELL_CLASS}
                  >
                    Memuat data user...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          data-dashboard-overlay="true"
          className="fixed inset-0 p-4"
          style={{
            background: "rgba(0, 0, 0, 0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editUser ? "Edit User" : "Tambah User"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Isi data akun pengguna sistem.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm"
                title="Tutup"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="input"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: event.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Masukkan username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, email: event.target.value }))
                  }
                  className="input"
                  placeholder="Masukkan email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No. Handphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                  className="input"
                  placeholder="Contoh: 0896786875"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Divisi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.division_id}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      division_id: event.target.value,
                    }))
                  }
                  className="select"
                >
                  <option value="">Pilih divisi</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role_id}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      role_id: event.target.value,
                    }))
                  }
                  className="select"
                >
                  <option value="">Pilih role</option>
                  {roles.map((roleOption) => (
                    <option key={roleOption.id} value={roleOption.id}>
                      {roleOption.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Akses Restrict
                    </p>
                  </div>
                  <UiverseCheckbox
                    checked={formData.is_restrict}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_restrict: checked }))
                    }
                    label={formData.is_restrict ? "Ya" : "Tidak"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.is_active ? "Aktif" : "Nonaktif"}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: event.target.value === "Aktif",
                    }))
                  }
                  className="select"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password{" "}
                  {editUser ? (
                    <span className="text-gray-400">(Opsional)</span>
                  ) : (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  className="input"
                  placeholder={
                    editUser
                      ? "Kosongkan jika tidak diubah"
                      : "Masukkan password"
                  }
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.name.trim() ||
                  !formData.username.trim() ||
                  !formData.email.trim() ||
                  !formData.division_id ||
                  !formData.role_id ||
                  (!editUser && !formData.password) ||
                  isSubmitting
                }
                className={editUser ? "btn btn-primary" : "btn btn-upload"}
              >
                {isSubmitting ? (
                  <>
                    <div
                      className="button-spinner"
                      style={
                        {
                          ["--spinner-size"]: "18px",
                          ["--spinner-border"]: "2px",
                        } as React.CSSProperties
                      }
                      aria-hidden="true"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" aria-hidden="true" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={showDelete && deleteUser !== null}
        title="Hapus User?"
        entityLabel="user"
        itemName={deleteUser?.name ?? ""}
        onClose={() => setShowDelete(false)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
