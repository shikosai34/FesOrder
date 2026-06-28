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
    <div className="min-h-[calc(100vh-4rem)] relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* 抽象的な背景装飾 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-multiply dark:mix-blend-screen opacity-50 animate-in fade-in duration-1000"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px] -z-10 mix-blend-multiply dark:mix-blend-screen opacity-50 animate-in fade-in duration-1000 delay-300"></div>

      {/* ヒーローセクション */}
      <section className="container mx-auto px-4 py-28 text-center animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary font-medium text-sm">
          次世代の学園祭体験を
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
          学園祭注文システム
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
          学園祭での注文管理を、もっとスマートに、もっとスムーズに。
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/circle-login">
            <Button size="lg" className="text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
              ログインして始める
            </Button>
          </Link>
          <Link href="/menu">
            <Button size="lg" variant="outline" className="text-lg rounded-full glass hover:bg-background/80">
              メニューを見る
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="ghost" className="text-lg rounded-full">
              <Shield className="mr-2 h-5 w-5" />
              管理者
            </Button>
          </Link>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">主な機能</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="glass-card border-none bg-background/40 hover:-translate-y-1 duration-300 animate-in fade-in slide-in-from-bottom-8"
                style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
              >
                <CardHeader>
                  <div className={`mb-5 p-3 rounded-2xl w-fit ${feature.color.replace('text-', 'bg-').replace('-500', '-500/10')} ${feature.color}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={feature.href as any} className="block mt-2">
                    <Button variant="ghost" className="w-full justify-between group">
                      詳しく見る
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 skew-y-3 origin-bottom-right -z-10"></div>
        <div className="container mx-auto px-4 z-10 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
            システムの特徴
          </h2>
          <div className="grid gap-10 md:grid-cols-3 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="text-5xl mb-6 transition-transform group-hover:scale-110 duration-300">⚡</div>
              <h3 className="text-xl font-semibold mb-3">圧倒的なスピード</h3>
              <p className="text-muted-foreground leading-relaxed">
                注文から完成まで、リアルタイムな情報共有でタイムラグを最小化し、行列を解消します。
              </p>
            </div>
            <div className="text-center group">
              <div className="text-5xl mb-6 transition-transform group-hover:scale-110 duration-300">📱</div>
              <h3 className="text-xl font-semibold mb-3">マルチデバイス対応</h3>
              <p className="text-muted-foreground leading-relaxed">
                スマホ、タブレット、PC。どの端末からでも専用アプリ不要でブラウザからすぐに利用可能です。
              </p>
            </div>
            <div className="text-center group">
              <div className="text-5xl mb-6 transition-transform group-hover:scale-110 duration-300">🔄</div>
              <h3 className="text-xl font-semibold mb-3">リアルタイム更新</h3>
              <p className="text-muted-foreground leading-relaxed">
                在庫や注文状況を自動で同期。売り切れや待ち時間の変動も即座に来場者へ伝わります。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="glass-card max-w-3xl mx-auto p-12 rounded-3xl border border-primary/10 bg-primary/5">
          <h2 className="text-3xl font-bold mb-6">今すぐ始めましょう</h2>
          <p className="text-xl text-muted-foreground mb-8">
            イベント名とサークル名を選択し、PINコードで簡単にログインできます。
          </p>
          <Link href="/circle-login">
            <Button size="lg" className="text-lg rounded-full px-8 py-6 h-auto shadow-lg hover:shadow-primary/30 transition-all hover:scale-105">
              ログイン画面へ進む
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
