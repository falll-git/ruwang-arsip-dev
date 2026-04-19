"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { filterMenuTreeForRoleRead, normalizePath } from "@/lib/rbac";
import type { DashboardMenuNode } from "@/types/rbac.types";

const LEGAL_DASHBOARD_PATH = "/dashboard/legal";

function findMenuByPath(
  nodes: DashboardMenuNode[],
  pathname: string,
): DashboardMenuNode | null {
  const normalizedPath = normalizePath(pathname);

  for (const node of nodes) {
    if (normalizePath(node.url) === normalizedPath) {
      return node;
    }

    const foundChild = findMenuByPath(node.children, normalizedPath);
    if (foundChild) {
      return foundChild;
    }
  }

  return null;
}

function getFirstLeafUrl(node: DashboardMenuNode): string | null {
  const children = [...node.children].sort(
    (left, right) => left.order - right.order,
  );

  for (const child of children) {
    const childLeaf = getFirstLeafUrl(child);
    if (childLeaf) {
      return childLeaf;
    }
  }

  const normalizedUrl = normalizePath(node.url);
  return normalizedUrl !== LEGAL_DASHBOARD_PATH ? normalizedUrl : null;
}

export default function LegalDashboardPage() {
  const router = useRouter();
  const { dashboardMenus, status, user } = useAuth();
  const redirectTarget = useMemo(() => {
    const visibleMenus = filterMenuTreeForRoleRead(user?.role_id, dashboardMenus);
    const legalRoot = findMenuByPath(visibleMenus, LEGAL_DASHBOARD_PATH);
    return legalRoot ? getFirstLeafUrl(legalRoot) : null;
  }, [dashboardMenus, user?.role_id]);

  useEffect(() => {
    if (status !== "authenticated") return;
    router.replace(redirectTarget ?? "/dashboard");
  }, [redirectTarget, router, status]);

  return null;
}
