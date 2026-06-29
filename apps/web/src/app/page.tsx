"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const features = [
    {
      title: "メニュー閲覧",
      description: "QRコードからアクセスして簡単にメニューを確認",
      href: "/menu",
      tag: "CUSTOMER",
      index: "01",
    },
    {
      title: "レジシステム",
      description: "直感的な操作で素早く注文を入力",
      href: "/register",
      tag: "POS",
      index: "02",
    },
    {
      title: "厨房管理",
      description: "注文をリアルタイムで確認・管理",
      href: "/backyard",
      tag: "KITCHEN",
      index: "03",
    },
    {
      title: "売上分析",
      description: "売上データを一目で確認",
      href: "/dashboard/sales",
      tag: "ANALYTICS",
      index: "04",
    },
  ];

  return (
    <div className="bg-background text-foreground font-body">
      {/* ヒーローセクション */}
      <section className="border-b-[5px] border-border py-sp-7 px-sp-4 bg-background">
        <div className="max-w-5xl mx-auto text-center space-y-sp-5">
          <div className="inline-block bg-accent text-accent-foreground font-headline uppercase text-[12px] tracking-[3px] px-sp-3 py-sp-2 border-[3px] border-accent">
            FESORDER // SYSTEM v1.0
          </div>
          <h1 className="text-[48px] sm:text-[64px] md:text-[80px] font-headline uppercase tracking-[-2px] leading-[1.0] text-foreground">
            学園祭
            <br className="md:hidden" />
            注文システム
          </h1>
          <p className="text-[16px] md:text-[18px] font-mono max-w-3xl mx-auto leading-[1.6] text-foreground">
            学園祭での注文管理を、もっとスマートに、もっとスムーズに。
            <br />
            無駄を削ぎ落としたリアルタイムPOS/KITCHENソリューション。
          </p>
          <div className="flex gap-sp-3 justify-center flex-wrap pt-sp-3">
            <Link href="/circle-login">
              <Button size="lg" variant="accent">
                ログインして始める
              </Button>
            </Link>
            <Link href="/menu">
              <Button size="lg" variant="outline">
                メニューを見る
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="py-sp-7 px-sp-4 border-b-[5px] border-border bg-muted">
        <div className="max-w-6xl mx-auto space-y-sp-5">
          <div className="flex justify-between items-end border-b-[3px] border-border pb-sp-3">
            <h2 className="text-[32px] md:text-[48px] font-headline uppercase tracking-tight leading-[1.05]">
              主な機能
            </h2>
            <span className="font-mono text-[13px] uppercase font-bold tracking-[1px]">
              [04 CORE MODULES]
            </span>
          </div>
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-background border-[3px] border-border p-sp-4 flex flex-col justify-between hover:bg-primary hover:text-primary-foreground group"
              >
                <div>
                  <div className="flex items-center justify-between mb-sp-4">
                    <span className="font-mono text-[28px] font-bold leading-none">
                      {feature.index}
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase border-[2px] border-border group-hover:border-primary-foreground px-sp-2 py-sp-1 tracking-[1px]">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-[24px] font-headline uppercase mb-sp-2 leading-[1.1]">
                    {feature.title}
                  </h3>
                  <p className="font-body text-[14px] leading-[1.5] mb-sp-4">
                    {feature.description}
                  </p>
                </div>
                <Link href={feature.href as any} className="block w-full mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between group-hover:bg-background group-hover:text-foreground group-hover:border-background"
                  >
                    アクセス
                    <span className="font-mono font-bold">→</span>
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 特徴 */}
      <section className="py-sp-7 px-sp-4 border-b-[5px] border-border bg-background">
        <div className="max-w-6xl mx-auto space-y-sp-5">
          <h2 className="text-[32px] md:text-[48px] font-headline uppercase tracking-tight text-center leading-[1.05]">
            システムの特徴
          </h2>
          <div className="grid gap-sp-4 md:grid-cols-3">
            <div className="border-[3px] border-border p-sp-5 bg-background space-y-sp-3">
              <div className="font-mono text-[28px] font-bold border-b-[2px] border-border pb-sp-2 text-accent">
                01 // SPEED
              </div>
              <h3 className="text-[22px] font-headline uppercase leading-[1.1]">
                圧倒的なスピード
              </h3>
              <p className="font-body text-[14px] leading-[1.6]">
                注文から調理完成までリアルタイム通信で共有。現場のタイムラグを極限まで削減。
              </p>
            </div>
            <div className="border-[3px] border-border p-sp-5 bg-background space-y-sp-3">
              <div className="font-mono text-[28px] font-bold border-b-[2px] border-border pb-sp-2 text-accent">
                02 // CROSS-PLATFORM
              </div>
              <h3 className="text-[22px] font-headline uppercase leading-[1.1]">
                マルチデバイス対応
              </h3>
              <p className="font-body text-[14px] leading-[1.6]">
                スマホ、タブレット、PC。あらゆるブラウザから専用アプリ不要で即時利用可能。
              </p>
            </div>
            <div className="border-[3px] border-border p-sp-5 bg-background space-y-sp-3">
              <div className="font-mono text-[28px] font-bold border-b-[2px] border-border pb-sp-2 text-accent">
                03 // REALTIME
              </div>
              <h3 className="text-[22px] font-headline uppercase leading-[1.1]">
                リアルタイム同期
              </h3>
              <p className="font-body text-[14px] leading-[1.6]">
                在庫数・販売状況を自動更新。完売情報や呼び出し状況も即座に画面へ反映。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-sp-7 px-sp-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto border-[5px] border-primary-foreground p-sp-5 md:p-sp-7 text-center space-y-sp-5 bg-primary">
          <h2 className="text-[32px] md:text-[48px] font-headline uppercase tracking-tight leading-[1.05]">
            GET STARTED NOW
          </h2>
          <p className="text-[16px] md:text-[18px] font-mono max-w-xl mx-auto leading-[1.5]">
            イベント名とサークル名を選択し、PINコードで瞬時にログイン可能。
          </p>
          <div>
            <Link href="/circle-login">
              <Button
                size="lg"
                variant="accent"
                className="border-[3px] border-transparent"
              >
                ログイン画面へ進む
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
