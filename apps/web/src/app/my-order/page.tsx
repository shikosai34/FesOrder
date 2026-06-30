"use client";

import { useState, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preOrderApi, wristbandApi, orderApi } from "@/lib/api";
import { useGuestUser } from "@/hooks/useGuestUser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  QrCode,
  Link as LinkIcon,
  X,
} from "lucide-react";

import { useAuth } from "@/hooks/useCircleAuth";

export default function MyOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId: guestUserId, isLoaded: isGuestLoaded } = useGuestUser();
  const { userId: authUserId, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newWristbandId, setNewWristbandId] = useState("");
  const [origin, setOrigin] = useState("");
  const [directOrders, setDirectOrders] = useState<Array<{
    orderId: string;
    orderNumber: string;
    circleId: string;
    circleName: string;
    totalPrice: number;
    createdAt: string;
    status?: string;
  }>>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let intervalId: any;
      const loadAndFetch = () => {
        const stored = localStorage.getItem("fesorder_direct_orders");
        if (stored) {
          const parsed = JSON.parse(stored);
          setDirectOrders(parsed);
          
          const fetchStatuses = async () => {
            const updated = await Promise.all(
              parsed.map(async (o: any) => {
                try {
                  const detail = await orderApi.get(o.orderId);
                  return { ...o, status: detail.status };
                } catch (err) {
                  return o;
                }
              })
            );
            setDirectOrders(updated);
            localStorage.setItem("fesorder_direct_orders", JSON.stringify(updated));
          };
          fetchStatuses();
        }
      };

      loadAndFetch();
      // 10秒おきにステータスをポーリング
      intervalId = setInterval(loadAndFetch, 10000);
      return () => clearInterval(intervalId);
    }
  }, []);

  const userId = isAuthenticated && authUserId ? authUserId : guestUserId;

  const isLoaded = isGuestLoaded && !authLoading;

  // 事前オーダー取得
  const { data: preOrders, isLoading: preOrdersLoading } = useQuery({
    queryKey: ["myPreOrders", userId],
    queryFn: () => preOrderApi.getByCode(userId),
    enabled: !!userId,
  });

  // ユーザー＆リストバンド状態取得
  const { data: userStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["userWristbandStatus", userId],
    queryFn: () => wristbandApi.lookup(userId),
    enabled: !!userId,
  });


  // 初期ロード時、アクティブなリストバンドがなければデフォルトで wb_admin_001 を自動紐付け
  const [autoBound, setAutoBound] = useState(false);
  useEffect(() => {
    if (userStatus && !userStatus.wristband && !autoBound && userId) {
      setAutoBound(true);
      wristbandApi.register(userId, "wb_admin_001").then(() => {
        queryClient.invalidateQueries({ queryKey: ["userWristbandStatus", userId] });
      });
    }
  }, [userStatus, autoBound, userId, queryClient]);



  // リストバンド新規登録・再発行ミューテーション
  const registerMutation = useMutation({
    mutationFn: async (wbId: string) => {
      return await wristbandApi.register(userId, wbId);
    },
    onSuccess: () => {
      toast.success("リストバンドの紐付けを完了しました！");
      setIsRegisterOpen(false);
      setNewWristbandId("");
      queryClient.invalidateQueries({ queryKey: ["userWristbandStatus", userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "紐付けに失敗しました");
    },
  });

  // リストバンド紛失報告ミューテーション
  const reportLostMutation = useMutation({
    mutationFn: async (wbId: string) => {
      return await wristbandApi.reportLost(wbId);
    },
    onSuccess: () => {
      toast.warning("旧リストバンドを無効化（ロック）しました。スマホQRはそのままご利用いただけます。");
      queryClient.invalidateQueries({ queryKey: ["userWristbandStatus", userId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "紛失報告に失敗しました");
    },
  });

  if (!isLoaded || preOrdersLoading || statusLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-4 font-mono">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const activeWristband = userStatus?.wristband;
  const targetWbId = activeWristband?.id || userId;
  const userCheckinUrl = origin ? `${origin}/checkin?wb=${targetWbId}` : targetWbId;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    userCheckinUrl
  )}`;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-24 font-mono">
      <button
        onClick={() => router.push("/menu")}
        className="text-xs uppercase tracking-widest underline hover:text-[#0000FF] flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        メニュー選択に戻る
      </button>

      <div className="border-b-[3px] border-black pb-4">
        <h1 className="text-3xl font-black uppercase tracking-tight">
          [マイデジタルQR & 注文履歴]
        </h1>
        <p className="text-xs uppercase tracking-widest text-gray-600 mt-1">
          店頭でこちらのQRまたはリストバンドをお見せください
        </p>
      </div>

      {/* リストバンド紛失・連携状態ステータスバー */}
      <div className="border-[3px] border-black bg-[#F0F0F0] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">【リストバンド連携状態】:</span>
            {activeWristband ? (
              <span className="bg-[#008000] text-white px-2 py-0.5 text-xs font-black uppercase">
                紐付け完了 ({activeWristband.id})
              </span>
            ) : (
              <span className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase">
                未紐付け / スマホ運用中
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsRegisterOpen(true)}
              className="h-9 border-[2px] border-black bg-white text-black text-xs font-bold uppercase rounded-none hover:bg-black hover:text-white"
            >
              <LinkIcon className="mr-1 h-3.5 w-3.5" />
              {activeWristband ? "再発行・付け替え" : "バンドを登録"}
            </Button>
            {activeWristband && (
              <Button
                onClick={() => {
                  if (confirm("失くしたリストバンドを即時ロック・無効化しますか？")) {
                    reportLostMutation.mutate(activeWristband.id);
                  }
                }}
                disabled={reportLostMutation.isPending}
                className="h-9 border-[2px] border-black bg-[#FF0000] text-white text-xs font-bold uppercase rounded-none hover:bg-black"
              >
                <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                紛失報告 (ロック)
              </Button>
            )}
          </div>
        </div>

        {!activeWristband && (
          <div className="bg-white border-[2px] border-black p-3 text-xs flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-black shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">💡 スマホのままで大丈夫です！</span>
              <p className="text-gray-600 mt-0.5">
                リストバンドが無くなった場合や未紐付けでも、下記の「マイデジタルQR」を店頭でスタッフに見せればそのままお受取りいただけます。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* リストバンド紐付けモーダル */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md border-[5px] border-black bg-white p-6 space-y-4">
            <div className="flex justify-between items-center border-b-[3px] border-black pb-3">
              <h3 className="font-black text-lg uppercase">[リストバンド紐付け]</h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="border-[2px] border-black p-1 hover:bg-black hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-600">
              手元の物理リストバンドのQRコードをスキャンするか、IDを入力してください。
            </p>
            <Input
              type="text"
              placeholder="リストバンドIDを入力 (例: wb_12345)"
              className="h-12 border-[3px] border-black text-base rounded-none"
              value={newWristbandId}
              onChange={(e) => setNewWristbandId(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newWristbandId.trim()) {
                  registerMutation.mutate(newWristbandId.trim());
                }
              }}
              disabled={registerMutation.isPending || !newWristbandId.trim()}
              className="w-full h-12 border-[3px] border-black bg-black text-white text-base font-bold uppercase rounded-none hover:bg-white hover:text-black"
            >
              紐付けを完了する
            </Button>
          </div>
        </div>
      )}

      {/* デジタルQRカード */}
      <Card className="border-[5px] border-black bg-black text-white rounded-none p-6 text-center shadow-none">
        <CardHeader className="p-0 mb-4">
          <div className="inline-block bg-white text-black px-3 py-1 text-xs font-black uppercase tracking-widest mx-auto">
            MEMBER DIGITAL QR
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <div className="bg-white p-4 inline-block border-[3px] border-white mx-auto">
            <img
              src={qrImageUrl}
              alt="My Digital QR"
              width={220}
              height={220}
              className="mx-auto block"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest">
              USER ID (呼出ID: #{userStatus?.user.displayId || "---"})
            </p>
            <p className="text-xl font-bold tracking-wider break-all">{userId}</p>
          </div>
        </CardContent>
      </Card>

      {/* モバイルオーダー（店頭支払い）履歴 */}
      {directOrders.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase border-b-[3px] border-black pb-2">
            [モバイルオーダー (店頭払い) 追跡]
          </h2>
          <div className="space-y-4">
            {directOrders.map((doOrder) => (
              <div
                key={doOrder.orderId}
                className="border-[4px] border-black bg-white p-5 space-y-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b-[2px] border-black pb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {doOrder.status === "pending" && (
                      <span className="bg-[#FFFF00] text-black border-[1.5px] border-black px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1 font-bold">
                        <Clock className="h-3.5 w-3.5" /> 店頭レジ未払い
                      </span>
                    )}
                    {doOrder.status === "preparing" && (
                      <span className="bg-[#0000FF] text-white px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1 font-bold animate-pulse">
                        <Clock className="h-3.5 w-3.5" /> 厨房で調理中
                      </span>
                    )}
                    {(doOrder.status === "ready" || doOrder.status === "completed") && (
                      <span className="bg-[#008000] text-white px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1 font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 受け取り可能！
                      </span>
                    )}
                    {doOrder.status === "cancelled" && (
                      <span className="bg-[#FF0000] text-white px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1 font-bold">
                        キャンセル
                      </span>
                    )}
                    <span className="text-xs text-gray-500 font-bold">
                      {doOrder.circleName} ({new Date(doOrder.createdAt).toLocaleTimeString("ja-JP")})
                    </span>
                  </div>
                  <span className="text-xl font-black">
                    ¥{doOrder.totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="bg-[#F0F0F0] p-3 border-[2px] border-black flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-bold">呼出注文番号</p>
                      <p className="text-2xl font-black text-black tracking-wider">{doOrder.orderNumber}</p>
                    </div>
                    {doOrder.status === "pending" && (
                      <p className="text-xs text-right text-black font-bold leading-normal max-w-[200px]">
                        ⚠️ レジでこの番号をスタッフに見せて代金を支払うと、調理が始まります。
                      </p>
                    )}
                    {doOrder.status === "preparing" && (
                      <p className="text-xs text-right text-blue-800 font-bold leading-normal max-w-[200px]">
                        ただいま調理中です。もうしばらくお待ちください。
                      </p>
                    )}
                    {(doOrder.status === "ready" || doOrder.status === "completed") && (
                      <p className="text-xs text-right text-green-800 font-bold leading-normal max-w-[200px]">
                        完成しました！受取口で注文番号を提示して商品をお受け取りください。
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 事前オーダー履歴一覧 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-black uppercase border-b-[3px] border-black pb-2">
          [事前オーダー状況]
        </h2>

        {preOrders && preOrders.length > 0 ? (
          <div className="space-y-4">
            {preOrders.map((po) => (
              <div
                key={po.id}
                className="border-[4px] border-black bg-white p-5 space-y-3"
              >
                <div className="flex justify-between items-start border-b-[2px] border-black pb-2">
                  <div className="flex items-center gap-2">
                    {po.status === "pending" ? (
                      <span className="bg-[#FFA500] text-black border-[1.5px] border-black px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> 店頭未受取
                      </span>
                    ) : (
                      <span className="bg-[#008000] text-white px-2 py-0.5 text-xs font-black uppercase flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 受取完了
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(po.createdAt).toLocaleTimeString("ja-JP")}
                    </span>
                  </div>
                  <span className="text-xl font-black">
                    ¥{po.totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="bg-[#F0F0F0] p-3 border-[2px] border-black">
                  <ul className="divide-y divide-black/10 text-sm">
                    {po.items.map((item) => (
                      <li key={item.id} className="py-1 flex justify-between">
                        <span className="font-bold">{item.menu?.name || "メニュー"}</span>
                        <span>x {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-[3px] border-dashed border-black p-8 text-center text-gray-500">
            現在、未処理の事前オーダーはありません。
          </div>
        )}
      </div>
    </div>
  );
}
