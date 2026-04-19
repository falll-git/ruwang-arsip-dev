import api from "@/lib/axios";
import { extractList, readNumber, readString } from "@/services/api.utils";
import type { DashboardMenuNode } from "@/types/rbac.types";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function mapMenuNode(record: UnknownRecord): DashboardMenuNode | null {
  const id = readString(record, "id");
  const name = readString(record, "name");
  const url = readString(record, "url");

  if (!id || !name || !url) return null;

  const children = Array.isArray(record.children)
    ? record.children
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null)
        .map((item) => mapMenuNode(item))
        .filter((item): item is DashboardMenuNode => item !== null)
    : [];

  return {
    id,
    name,
    parent_id: readString(record, "parent_id") ?? null,
    parent: readString(record, "parent") ?? null,
    icon: readString(record, "icon") ?? undefined,
    url,
    order: readNumber(record, "order") ?? 0,
    children,
  };
}

export const menuService = {
  getAll: async (): Promise<DashboardMenuNode[]> => {
    const res = await api.get("/menus");
    return extractList(res.data)
      .map((record) => mapMenuNode(record))
      .filter((item): item is DashboardMenuNode => item !== null);
  },
};
