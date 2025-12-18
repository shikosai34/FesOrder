"use client";

import {
  CircleAuthGuard,
  PermissionGuard,
  useAuth,
  ROLE_NAMES,
} from "@/hooks/useCircleAuth";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MenuSquare,
  Package,
  BarChart3,
  Users,
  Settings,
  UserCog,
  Shield,
} from "lucide-react";

function DashboardContent() {
  const { role, roleName, userName } = useAuth();

  const menuItems = [
    {
      title: "メニュー管理",
      description: "メニューとトッピングの追加・編集",
      icon: MenuSquare,
      href: "/dashboard/menu",
      color: "text-blue-500",
      permission: "menu:read" as const,
    },
    {
      title: "在庫管理",
      description: "在庫の確認と更新",
      icon: Package,
      href: "/dashboard/stock",
      color: "text-green-500",
      permission: "stock:read" as const,
    },
    {
      title: "売上管理",
      description: "売上データの確認と分析",
      icon: BarChart3,
      href: "/dashboard/sales",
      color: "text-purple-500",
      permission: "sales:read" as const,
    },
    {
      title: "スタッフ管理",
      description: "シフトとスタッフの管理",
      icon: Users,
      href: "/dashboard/staff",
      color: "text-orange-500",
      permission: "staff:read" as const,
    },
    {
      title: "サークル設定",
      description: "サークル情報の編集",
      icon: Settings,
      href: "/dashboard/circle",
      color: "text-gray-500",
      permission: "circle:read" as const,
    },
    {
      title: "メンバー管理",
      description: "メンバーの追加・権限設定",
      icon: UserCog,
      href: "/dashboard/members",
      color: "text-pink-500",
      permission: "member:read" as const,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">ダッシュボード</h1>
          <p className="text-muted-foreground">
            サークル管理システムへようこそ
          </p>
        </div>
        {role && (
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="text-right">
              {userName && <p className="text-sm font-medium">{userName}</p>}
              <Badge variant="secondary">{roleName}</Badge>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <PermissionGuard key={item.href} permission={item.permission}>
              <Link href={item.href as any}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg bg-secondary ${item.color}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle>{item.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </PermissionGuard>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <PermissionGuard permission="order:write">
              <Link href="/register">
                <Button className="w-full" variant="outline">
                  レジを開く
                </Button>
              </Link>
            </PermissionGuard>
            <PermissionGuard permission="order:read">
              <Link href="/backyard">
                <Button className="w-full" variant="outline">
                  厨房ビューを開く
                </Button>
              </Link>
            </PermissionGuard>
            <Link href="/menu">
              <Button className="w-full" variant="outline">
                メニューを見る
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>お知らせ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              新しいお知らせはありません
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <CircleAuthGuard>
      <DashboardContent />
    </CircleAuthGuard>
  );
}
