"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ShoppingCart,
  ChefHat,
  BarChart3,
  MenuSquare,
  Shield,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "メニュー閲覧",
      description: "QRコードからアクセスして簡単にメニューを確認",
      icon: MenuSquare,
      href: "/menu",
      color: "text-blue-500",
    },
    {
      title: "レジシステム",
      description: "直感的な操作で素早く注文を入力",
      icon: ShoppingCart,
      href: "/register",
      color: "text-green-500",
    },
    {
      title: "厨房管理",
      description: "注文をリアルタイムで確認・管理",
      icon: ChefHat,
      href: "/backyard",
      color: "text-orange-500",
    },
    {
      title: "売上分析",
      description: "売上データを一目で確認",
      icon: BarChart3,
      href: "/dashboard/sales",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          学園祭注文システム
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          学園祭での注文管理を、もっとスマートに、もっとスムーズに
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/circle-login">
            <Button size="lg" className="text-lg">
              ログインして始める
            </Button>
          </Link>
          <Link href="/menu">
            <Button size="lg" variant="outline" className="text-lg">
              メニューを見る
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="ghost" className="text-lg">
              <Shield className="mr-2 h-5 w-5" />
              管理者
            </Button>
          </Link>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">主な機能</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className={`mb-4 ${feature.color}`}>
                    <Icon className="h-12 w-12" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href as any}>
                    <Button variant="ghost" className="w-full">
                      詳しく見る →
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 特徴 */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            システムの特徴
          </h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">高速処理</h3>
              <p className="text-muted-foreground">
                注文から完成まで、スムーズな情報共有でタイムラグを最小化
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">マルチデバイス対応</h3>
              <p className="text-muted-foreground">
                スマホ、タブレット、PCどの端末からでも利用可能
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-2">リアルタイム更新</h3>
              <p className="text-muted-foreground">
                在庫や注文状況を自動で同期し、常に最新の情報を表示
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">今すぐ始めましょう</h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          イベント名とサークル名でログインして、システムを利用開始
        </p>
        <Link href="/circle-login">
          <Button size="lg" className="text-lg">
            ログイン画面へ →
          </Button>
        </Link>
      </section>
    </div>
  );
}
