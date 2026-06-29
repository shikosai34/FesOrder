"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { preOrderApi, type PreOrderWithDetails } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { QrCode, X, CheckCircle2, Search, Camera } from "lucide-react";

interface QrScannerModalProps {
  circleId: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderClaimed?: (orderNumber: string) => void;
}

export function QrScannerModal({
  circleId,
  isOpen,
  onClose,
  onOrderClaimed,
}: QrScannerModalProps) {
  const [scannedCode, setScannedCode] = useState("");
  const [preOrders, setPreOrders] = useState<PreOrderWithDetails[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      stopCamera();
      setScannedCode("");
      setPreOrders([]);
    }
  }, [isOpen]);

  // カメラ起動
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      toast.info("カメラを起動しました。QRコードにかざしてください");
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("カメラの起動に失敗しました。キーボードまたはスキャナー入力をご利用ください");
    }
  };

  // カメラ停止
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // 事前オーダー検索
  const searchMutation = useMutation({
    mutationFn: async (code: string) => {
      return await preOrderApi.getByCode(code, circleId);
    },
    onSuccess: (data) => {
      setPreOrders(data);
      if (data.length === 0) {
        toast.warning("未受取の事前オーダーが見つかりませんでした");
      } else {
        toast.success(`${data.length}件の事前オーダーが見つかりました`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "照会に失敗しました");
    },
  });

  // 受取確定処理
  const claimMutation = useMutation({
    mutationFn: async (preOrderId: string) => {
      return await preOrderApi.claim(preOrderId);
    },
    onSuccess: (data) => {
      toast.success(`受取確定！ 注文番号: ${data.orderNumber}`, {
        style: {
          border: "3px solid #000",
          borderRadius: "0px",
          background: "#000",
          color: "#fff",
          fontWeight: "bold",
        },
      });
      if (onOrderClaimed) {
        onOrderClaimed(data.orderNumber);
      }
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "受取確定に失敗しました");
    },
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scannedCode.trim()) return;
    searchMutation.mutate(scannedCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      {/* RawBlock モーダルコンテナ */}
      <div className="relative w-full max-w-2xl border-[5px] border-black bg-white p-6 shadow-none">
        {/* ヘッダー */}
        <div className="mb-6 flex items-center justify-between border-b-[3px] border-black pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-black p-2 text-white">
              <QrCode className="h-6 w-6" />
            </div>
            <h2 className="font-mono text-2xl font-black uppercase tracking-wider">
              [QR / リストバンド照会]
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border-[3px] border-black bg-white p-1 hover:bg-black hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* カメラ/スキャナー入力エリア */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Label htmlFor="qrInput" className="sr-only">
                リストバンドID / ユーザーID
              </Label>
              <Input
                id="qrInput"
                ref={inputRef}
                type="text"
                placeholder="リストバンドQRをスキャン / コード入力..."
                className="h-14 border-[3px] border-black bg-[#F0F0F0] font-mono text-lg rounded-none focus-visible:border-[5px] focus-visible:ring-0"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              disabled={searchMutation.isPending}
              className="h-14 border-[3px] border-black bg-black px-6 font-mono text-base font-bold uppercase text-white rounded-none hover:bg-white hover:text-black"
            >
              <Search className="mr-2 h-5 w-5" />
              照会
            </Button>
            <Button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className="h-14 border-[3px] border-black bg-white px-4 text-black rounded-none hover:bg-black hover:text-white"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </form>

          {/* カメラプレビュー */}
          {isCameraActive && (
            <div className="relative h-48 w-full overflow-hidden border-[3px] border-black bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 border-[3px] border-dashed border-red-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* 検索結果リスト */}
        <div className="max-h-[350px] overflow-y-auto space-y-4 pr-1">
          {searchMutation.isPending && (
            <div className="py-8 text-center font-mono font-bold uppercase">
              照会中...
            </div>
          )}

          {!searchMutation.isPending && preOrders.length === 0 && (
            <div className="border-[3px] border-dashed border-black p-8 text-center font-mono text-gray-500">
              リストバンドQRコードをスキャンするか、IDを入力して「照会」を押してください。
            </div>
          )}

          {preOrders.map((po) => (
            <div
              key={po.id}
              className="border-[4px] border-black bg-white p-5 space-y-4"
            >
              <div className="flex justify-between items-start border-b-[2px] border-black pb-3">
                <div>
                  <span className="bg-black text-white px-2 py-1 font-mono text-xs font-bold uppercase tracking-widest">
                    事前オーダー
                  </span>
                  <p className="font-mono text-xs text-gray-600 mt-1">
                    ID: {po.id} | 登録: {new Date(po.createdAt).toLocaleTimeString("ja-JP")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-2xl font-black">
                    ¥{po.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 注文アイテム明細 */}
              <div className="space-y-2 bg-[#F0F0F0] p-3 border-[2px] border-black">
                <p className="font-mono text-xs font-bold uppercase tracking-wider">
                  [注文内容]
                </p>
                <ul className="divide-y divide-black/20 font-mono text-sm">
                  {po.items.map((item) => (
                    <li key={item.id} className="py-1.5 flex justify-between">
                      <span className="font-bold">{item.menu?.name || "メニュー"}</span>
                      <span>x {item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 確定ボタン */}
              <Button
                onClick={() => claimMutation.mutate(po.id)}
                disabled={claimMutation.isPending}
                className="w-full h-14 border-[3px] border-black bg-black font-mono text-lg font-black uppercase text-white rounded-none hover:bg-[#008000] hover:text-white transition-all shadow-none active:translate-y-1"
              >
                <CheckCircle2 className="mr-2 h-6 w-6" />
                {claimMutation.isPending ? "処理中..." : "【受取確定＆調理開始】"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
