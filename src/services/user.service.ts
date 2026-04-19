import api from "@/lib/axios";
import {
  extractList,
  extractRecord,
  readBoolean,
  readString,
} from "@/services/api.utils";
import type { UserPayload, UserRecord } from "@/types/auth.types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function mapUser(record: UnknownRecord): UserRecord | null {
  const roleRecord = asRecord(record.role);
  const divisionRecord = asRecord(record.division);
  const id = readString(record, "id");
  const username = readString(record, "username");
  const email = readString(record, "email");
  const name =
    readString(record, "name", "full_name", "fullName") ?? username ?? null;
  const roleId =
    readString(record, "role_id", "roleId") ??
    (roleRecord ? readString(roleRecord, "id") : null);
  const divisionId =
    readString(record, "division_id", "divisionId") ??
    (divisionRecord ? readString(divisionRecord, "id") : null);

  if (!id || !username || !email || !name || !roleId || !divisionId) {
    return null;
  }

  return {
    id,
    username,
    email,
    name,
    role_id: roleId,
    division_id: divisionId,
    is_restrict: readBoolean(record, "is_restrict", "isRestrict"),
    is_active:
      !("is_active" in record || "isActive" in record) ||
      readBoolean(record, "is_active", "isActive"),
    phone:
      readString(
        record,
        "phone",
        "phone_number",
        "phoneNumber",
        "whatsapp_number",
        "whatsappNumber",
        "no_hp",
        "noHp",
        "no_handphone",
        "noHandphone",
      ) ?? undefined,
    phone_number:
      readString(
        record,
        "phone",
        "phone_number",
        "phoneNumber",
        "whatsapp_number",
        "whatsappNumber",
        "no_hp",
        "noHp",
        "no_handphone",
        "noHandphone",
      ) ?? undefined,
    role_name:
      readString(record, "role_name", "roleName") ??
      (roleRecord
        ? readString(
            roleRecord,
            "name",
            "label",
            "role_name",
            "roleName",
          ) ?? undefined
        : undefined),
    division_name:
      readString(record, "division_name", "divisionName") ??
      (divisionRecord
        ? readString(
            divisionRecord,
            "name",
            "label",
            "division_name",
            "divisionName",
          ) ?? undefined
        : undefined),
  };
}

export const userService = {
  getAll: async (): Promise<UserRecord[]> => {
    const res = await api.get("/users");
    return extractList(res.data)
      .map((record) => mapUser(record))
      .filter((item): item is UserRecord => item !== null);
  },
  getMe: async (): Promise<UserRecord | null> => {
    const res = await api.get("/users/me");
    const record = extractRecord(res.data);
    return record ? mapUser(record) : null;
  },
  getById: async (id: string): Promise<UserRecord | null> => {
    const res = await api.get(`/users/${id}`);
    const record = extractRecord(res.data);
    return record ? mapUser(record) : null;
  },
  create: async (data: UserPayload): Promise<UserRecord> => {
    const res = await api.post("/users", data);
    const record = extractRecord(res.data);
    const mapped = record ? mapUser(record) : null;

    if (!mapped) {
      throw new Error("Respons create user dari server tidak valid");
    }

    return mapped;
  },
  update: async (id: string, data: UserPayload): Promise<UserRecord> => {
    const res = await api.put(`/users/${id}`, data);
    const record = extractRecord(res.data);
    const mapped = record ? mapUser(record) : null;

    if (!mapped) {
      throw new Error("Respons update user dari server tidak valid");
    }

    return mapped;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
