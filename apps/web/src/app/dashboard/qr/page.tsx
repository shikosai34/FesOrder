"use client";

import { useEffect, useState } from "react";
import {
  CircleAuthGuard,
  PermissionGuard,
  useAuth,
} from "@/hooks/useCircleAuth";
import { useQuery } from "@tanstack/react-query";
import { circleApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, QrCode, Smartphone } from "lucide-react";
import Link from "next/link";

function CircleQrContent() {
  const { circleId } = useAuth();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const { data: circle, isLoading } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => circleApi.get(circleId!),
    enabled: !!circleId,
  });

  if (isLoading || !circleId) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4 font-mono">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const mobileOrderUrl = `${origin}/menu?circleId=${circleId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(
    mobileOrderUrl
  )}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-20">
      {/* ナビゲーション・アクション（印刷時には非表示） */}
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-[3px] border-black pb-4">
        <div>
          <Link
            href="/dashboard"
            className="font-mono text-xs uppercase tracking-widest underline hover:text-[#0000FF] flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            ダッシュボードに戻る
          </Link>
          <h1 className="text-3xl font-black font-mono uppercase tracking-tight">
            [店頭掲示用 モバイルオーダーQR POP]
          </h1>
        </div>
        <Button
          onClick={handlePrint}
          className="h-14 border-[3px] border-black bg-black px-6 font-mono text-lg font-bold uppercase text-white rounded-none hover:bg-white hover:text-black transition-all"
        >
          <Printer className="mr-2 h-6 w-6" />
          POPを印刷 / PDF出力
        </Button>
      </div>

      {/* 店頭掲示用 POP シート (印刷対象) */}
      <div className="print:m-0 print:p-0 print:border-none print:shadow-none border-[8px] border-black bg-white p-8 space-y-8 text-center text-black">
        {/* POP ヘッダー */}
        <div className="bg-black text-white p-6 border-[4px] border-black space-y-2">
          <span className="bg-white text-black px-4 py-1 font-mono text-sm font-black uppercase tracking-widest inline-block">
            MOBILE ORDER AVAILABLE
          </span>
          <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-wider font-mono leading-none">
            {circle?.name || "店舗名"}
          </h2>
          <p className="font-mono text-sm text-gray-300 uppercase tracking-widest">
            スマホで事前注文＆並ばずに即受取！
          </p>
        </div>

        {/* メイン QR 描画エリア */}
        <div className="my-8 flex flex-col items-center justify-center space-y-6">
          <div className="relative border-[6px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <img
              src={qrImageUrl}
              alt="Mobile Order QR Code"
              width={280}
              height={280}
              className="mx-auto block"
            />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 font-mono font-black text-xl sm:text-2xl uppercase">
              <Smartphone className="h-7 w-7" />
              <span>QRコードをカメラでスキャン</span>
            </div>
            <p className="font-mono text-xs text-gray-600 break-all bg-[#F0F0F0] p-2 border-[2px] border-black">
              {mobileOrderUrl}
            </p>
          </div>
        </div>

        {/* POP フッターステップ案内 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-left pt-4 border-t-[4px] border-black">
          <div className="border-[3px] border-black p-3 bg-[#F0F0F0]">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold mr-2">
              STEP 1
            </span>
            <p className="font-bold text-sm mt-1">QRを読み取り</p>
            <p className="text-xs text-gray-600">メニュー一覧が開きます</p>
          </div>
          <div className="border-[3px] border-black p-3 bg-[#F0F0F0]">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold mr-2">
              STEP 2
            </span>
            <p className="font-bold text-sm mt-1">メニューを選び注文</p>
            <p className="text-xs text-gray-600">事前オーダーを送信</p>
          </div>
          <div className="border-[3px] border-black p-3 bg-[#F0F0F0]">
            <span className="bg-black text-white px-2 py-0.5 text-xs font-bold mr-2">
              STEP 3
            </span>
            <p className="font-bold text-sm mt-1">店頭でマイQR提示</p>
            <p className="text-xs text-gray-600">一瞬で受け取れます</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CircleQrPage() {
  return (
    <CircleAuthGuard>
      <PermissionGuard permission="circle:read">
        <CircleQrContent />
      </PermissionGuard>
    </CircleAuthGuard>
  );
}
