"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Loader from "@/components/loader";

// ロール定義（バックエンドと同期）
export const ROLES = {
  EVENT_ADMIN: "event_admin",
  CIRCLE_MANAGER: "circle_manager",
  CASHIER: "cashier",
  KITCHEN_STAFF: "kitchen_staff",
  WAITER: "waiter",
  STOCK_MANAGER: "stock_manager",
  VIEWER: "viewer",
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

// ロールの日本語名
export const ROLE_NAMES: Record<RoleType, string> = {
  [ROLES.EVENT_ADMIN]: "イベント管理者",
  [ROLES.CIRCLE_MANAGER]: "サークルマネージャー",
  [ROLES.CASHIER]: "レジ担当",
  [ROLES.KITCHEN_STAFF]: "厨房スタッフ",
  [ROLES.WAITER]: "ウェイター",
  [ROLES.STOCK_MANAGER]: "在庫管理",
  [ROLES.VIEWER]: "閲覧者",
};

// 権限定義
export const ROLE_PERMISSIONS = {
  [ROLES.EVENT_ADMIN]: [
    "event:read",
    "event:write",
    "event:delete",
    "circle:read",
    "circle:write",
    "circle:delete",
    "menu:read",
    "menu:write",
    "menu:delete",
    "order:read",
    "order:write",
    "order:delete",
    "staff:read",
    "staff:write",
    "staff:delete",
    "stock:read",
    "stock:write",
    "sales:read",
    "member:read",
    "member:write",
    "member:delete",
  ],
  [ROLES.CIRCLE_MANAGER]: [
    "circle:read",
    "circle:write",
    "menu:read",
    "menu:write",
    "menu:delete",
    "order:read",
    "order:write",
    "staff:read",
    "staff:write",
    "staff:delete",
    "stock:read",
    "stock:write",
    "sales:read",
    "member:read",
    "member:write",
  ],
  [ROLES.CASHIER]: [
    "circle:read",
    "menu:read",
    "order:read",
    "order:write",
    "stock:read",
  ],
  [ROLES.KITCHEN_STAFF]: [
    "circle:read",
    "menu:read",
    "order:read",
    "order:write",
    "stock:read",
  ],
  [ROLES.WAITER]: ["circle:read", "menu:read", "order:read", "order:write"],
  [ROLES.STOCK_MANAGER]: [
    "circle:read",
    "menu:read",
    "stock:read",
    "stock:write",
  ],
  [ROLES.VIEWER]: ["circle:read", "menu:read", "order:read"],
} as const;

export type Permission = (typeof ROLE_PERMISSIONS)[RoleType][number];

// 認証情報の型
interface AuthInfo {
  circleId: string | null;
  eventId: string | null;
  userEmail: string | null;
  userName: string | null;
  role: RoleType | null;
  membershipId: string | null;
}

// LocalStorageのキー
const AUTH_STORAGE_KEY = "circleAuth";

// 認証情報を保存
export function saveAuthInfo(info: AuthInfo) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(info));
    // 後方互換性のため circleId も保存
    if (info.circleId) {
      localStorage.setItem("circleId", info.circleId);
    }
  }
}

// 認証情報を取得
export function getAuthInfo(): AuthInfo | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  // 後方互換性: 古い形式からの移行
  const circleId = localStorage.getItem("circleId");
  if (circleId) {
    return {
      circleId,
      eventId: null,
      userEmail: null,
      userName: null,
      role: null,
      membershipId: null,
    };
  }

  return null;
}

// 認証情報をクリア
export function clearAuthInfo() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("circleId");
  }
}

// 権限チェック
export function hasPermission(
  role: RoleType | null | undefined,
  permission: string
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] as readonly string[];
  return permissions?.includes(permission) ?? false;
}

// 複数の権限のいずれかを持っているかチェック
export function hasAnyPermission(
  role: RoleType | null | undefined,
  permissions: string[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// すべての権限を持っているかチェック
export function hasAllPermissions(
  role: RoleType | null | undefined,
  permissions: string[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// 基本的な認証フック（後方互換性維持）
export function useCircleAuth() {
  const router = useRouter();
  const [circleId, setCircleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authInfo = getAuthInfo();
    if (!authInfo?.circleId) {
      router.push("/circle-login");
    } else {
      setCircleId(authInfo.circleId);
    }
    setIsLoading(false);
  }, [router]);

  return { circleId, isLoading };
}

// ロール対応の認証フック
export function useAuth() {
  const router = useRouter();
  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const info = getAuthInfo();
    setAuthInfo(info);
    setIsLoading(false);
  }, []);

  const login = useCallback((info: AuthInfo) => {
    saveAuthInfo(info);
    setAuthInfo(info);
  }, []);

  const logout = useCallback(() => {
    clearAuthInfo();
    setAuthInfo(null);
    router.push("/circle-login");
  }, [router]);

  const checkPermission = useCallback(
    (permission: Permission) => {
      return hasPermission(authInfo?.role ?? null, permission);
    },
    [authInfo?.role]
  );

  const checkAnyPermission = useCallback(
    (permissions: Permission[]) => {
      return hasAnyPermission(authInfo?.role ?? null, permissions);
    },
    [authInfo?.role]
  );

  return {
    ...authInfo,
    isAuthenticated: !!authInfo?.circleId,
    isLoading,
    login,
    logout,
    checkPermission,
    checkAnyPermission,
    roleName: authInfo?.role ? ROLE_NAMES[authInfo.role] : null,
  };
}

// 権限ガードコンポーネント
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(role, permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(role, permissions)
      : hasAnyPermission(role, permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 認証ガードコンポーネント（後方互換性維持）
export function CircleAuthGuard({ children }: { children: React.ReactNode }) {
  const { circleId, isLoading } = useCircleAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!circleId) {
    return null;
  }

  return <>{children}</>;
}

// ロール別のアクセス制御ガード
export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
}: {
  children: React.ReactNode;
  allowedRoles: RoleType[];
  fallback?: React.ReactNode;
}) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
