"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { eventApi, circleApi, menuApi, preOrderApi } from "@/lib/api";
import { useGuestUser } from "@/hooks/useGuestUser";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import { ShoppingCart, Plus, Minus, CheckCircle } from "lucide-react";

interface CartItem {
  menuId: string;
  menuName: string;
  menuPrice: number;
  quantity: number;
}

function MenuPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const circleIdParam = searchParams.get("circleId");
  const { userId } = useGuestUser();

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(
    circleIdParam
  );
  const [cart, setCart] = useState<CartItem[]>([]);

  // イベント一覧取得
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => eventApi.list(),
  });

  // 選択したイベントのサークル一覧取得
  const { data: circles, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles", selectedEventId],
    queryFn: () => circleApi.list(selectedEventId!),
    enabled: !!selectedEventId,
  });

  // 選択したサークルの情報取得
  const { data: circleData, isLoading: circleLoading } = useQuery({
    queryKey: ["circle", selectedCircleId],
    queryFn: () => circleApi.get(selectedCircleId!),
    enabled: !!selectedCircleId,
  });

  // 選択したサークルのメニュー取得
  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ["menus", selectedCircleId],
    queryFn: () => menuApi.list(selectedCircleId!),
    enabled: !!selectedCircleId,
  });

  useEffect(() => {
    if (circleIdParam) {
      setSelectedCircleId(circleIdParam);
    }
  }, [circleIdParam]);

  // 事前オーダー作成ミューテーション
  const preOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCircleId || cart.length === 0) return;
      return await preOrderApi.create({
        userId,
        circleId: selectedCircleId,
        items: cart.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      });
    },
    onSuccess: () => {
      toast.success("事前オーダーを送信しました！店頭でマイQRを提示してください。");
      setCart([]);
      router.push("/my-order");
    },
    onError: (error: any) => {
      toast.error(error.message || "事前オーダーの送信に失敗しました");
    },
  });

  const addToCart = (menuId: string, menuName: string, menuPrice: number) => {
    const existing = cart.find((i) => i.menuId === menuId);
    if (existing) {
      setCart(
        cart.map((i) =>
          i.menuId === menuId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { menuId, menuName, menuPrice, quantity: 1 }]);
    }
    toast.success(`${menuName}をカートに追加しました`);
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setCart(
      cart
        .map((i) =>
          i.menuId === menuId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const getTotalCount = () => cart.reduce((sum, i) => sum + i.quantity, 0);
  const getTotalPrice = () => cart.reduce((sum, i) => sum + i.menuPrice * i.quantity, 0);

  // イベント選択画面
  if (!selectedEventId && !selectedCircleId) {
    return (
      <div className="max-w-6xl mx-auto p-sp-4 space-y-sp-5">
        <div className="border-b-[3px] border-black pb-sp-3 mb-sp-5 flex justify-between items-end">
          <div>
            <h1 className="text-[48px] font-headline uppercase tracking-tight leading-[1.0]">
              モバイルオーダー
            </h1>
            <p className="font-mono text-[14px] uppercase tracking-[1px] mt-sp-1">
              イベントを選択してください
            </p>
          </div>
          <Button
            onClick={() => router.push("/my-order")}
            className="border-[3px] border-border bg-background font-mono font-bold text-foreground rounded-none hover:bg-accent hover:text-accent-foreground uppercase tracking-wider transition-all"
          >
            マイQR / 注文履歴
          </Button>
        </div>

        {eventsLoading ? (
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground group transition-all"
                onClick={() => setSelectedEventId(event.id)}
              >
                <CardHeader>
                  <CardTitle>{event.eventName}</CardTitle>
                  {event.description && (
                    <CardDescription className="group-hover:text-accent-foreground opacity-90">
                      {event.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-[13px] font-mono">
                    {event.startDate && (
                      <p>
                        {new Date(event.startDate).toLocaleDateString("ja-JP")}
                        {event.endDate && (
                          <> 〜 {new Date(event.endDate).toLocaleDateString("ja-JP")}</>
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-sp-7 text-center">
              <p className="font-body text-[16px]">
                現在公開中のイベントはありません
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // サークル選択画面
  if (selectedEventId && !selectedCircleId) {
    const selectedEvent = events?.find((e) => e.id === selectedEventId);

    return (
      <div className="max-w-6xl mx-auto p-sp-4 space-y-sp-5">
        <button
          onClick={() => setSelectedEventId(null)}
          className="font-mono text-[13px] uppercase tracking-[1px] underline hover:text-[#0000FF]"
        >
          ← イベント選択に戻る
        </button>

        <div className="border-b-[3px] border-black pb-sp-3 flex justify-between items-end">
          <div>
            <Badge variant="default" className="mb-sp-2">
              {selectedEvent?.eventName}
            </Badge>
            <h1 className="text-[48px] font-headline uppercase tracking-tight leading-[1.0]">
              出店一覧
            </h1>
            <p className="font-mono text-[14px] uppercase tracking-[1px] mt-sp-1">
              注文したいお店を選んでください
            </p>
          </div>
          <Button
            onClick={() => router.push("/my-order")}
            className="border-[3px] border-border bg-background font-mono font-bold text-foreground rounded-none hover:bg-accent hover:text-accent-foreground uppercase tracking-wider transition-all"
          >
            マイQR
          </Button>
        </div>

        {circlesLoading ? (
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : circles && circles.length > 0 ? (
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
            {circles.map((circle) => (
              <Card
                key={circle.id}
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground group transition-all"
                onClick={() => setSelectedCircleId(circle.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-sp-3">
                    {circle.iconImagePath ? (
                      <Image
                        src={circle.iconImagePath}
                        alt={circle.name}
                        width={48}
                        height={48}
                        className="border-[2px] border-black group-hover:border-white"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-[#F0F0F0] border-[2px] border-black group-hover:bg-white flex items-center justify-center">
                        <span className="font-headline text-[18px] uppercase">
                          {circle.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <CardTitle>{circle.name}</CardTitle>
                      {circle.description && (
                        <CardDescription className="line-clamp-2 group-hover:text-white">
                          {circle.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-sp-7 text-center">
              <p className="font-body text-[16px]">
                このイベントにはまだ出店がありません
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // メニュー表示画面
  if (circleLoading || menusLoading) {
    return (
      <div className="max-w-6xl mx-auto p-sp-4 space-y-sp-3">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-sp-4 space-y-sp-5 pb-32">
      {/* 戻るボタン */}
      <button
        onClick={() => {
          setSelectedCircleId(null);
          if (circleIdParam) {
            setSelectedEventId(null);
          }
        }}
        className="font-mono text-[13px] uppercase tracking-[1px] underline hover:text-[#0000FF]"
      >
        ← 出店一覧に戻る
      </button>

      {/* サークル情報ヘッダー */}
      {circleData && (
        <div
          className="relative min-h-[200px] border-[5px] border-black bg-black text-white p-sp-5 flex flex-col justify-center items-center text-center"
          style={
            circleData.backgroundImagePath
              ? {
                  backgroundImage: `url(${circleData.backgroundImagePath})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="bg-black/80 border-[3px] border-white p-sp-4 max-w-2xl w-full">
            {circleData.iconImagePath && (
              <Image
                src={circleData.iconImagePath}
                alt={circleData.name}
                width={80}
                height={80}
                className="mx-auto border-[2px] border-white mb-sp-3"
              />
            )}
            <h1 className="text-[48px] font-headline uppercase tracking-tight mb-sp-1 leading-[1.0]">
              {circleData.name}
            </h1>
            {circleData.description && (
              <p className="text-[15px] font-mono leading-[1.5]">
                {circleData.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* メニュー一覧 */}
      <div>
        <h2 className="text-[32px] font-headline uppercase tracking-tight mb-sp-3 leading-[1.1]">
          メニューを選択して事前注文
        </h2>
        {menus && menus.length > 0 ? (
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => {
              const cartItem = cart.find((i) => i.menuId === menu.id);
              const qty = cartItem ? cartItem.quantity : 0;

              return (
                <Card key={menu.id} className={menu.soldOut ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="relative h-48 w-full overflow-hidden border-b-[3px] border-black">
                      {menu.imagePath ? (
                        <Image
                          src={menu.imagePath}
                          alt={menu.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#F0F0F0]">
                          <span className="font-mono text-[14px] uppercase tracking-[1px]">
                            No Image
                          </span>
                        </div>
                      )}
                      {menu.soldOut && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <span className="text-white text-[24px] font-headline uppercase tracking-[2px]">
                            売り切れ
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="mb-sp-2">{menu.name}</CardTitle>
                    <p className="text-[24px] font-headline mb-sp-2">
                      ¥{menu.price.toLocaleString()}
                    </p>
                    {menu.description && (
                      <CardDescription className="mb-sp-2">
                        {menu.description}
                      </CardDescription>
                    )}
                  </CardContent>

                  <CardFooter className="border-t-[3px] border-black pt-4">
                    {qty > 0 ? (
                      <div className="flex items-center justify-between w-full bg-[#F0F0F0] border-[2px] border-black p-1">
                        <Button
                          type="button"
                          onClick={() => updateQuantity(menu.id, -1)}
                          className="h-10 w-10 border-[2px] border-border bg-background text-foreground rounded-none hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-mono font-bold text-lg px-4">
                          {qty}
                        </span>
                        <Button
                          type="button"
                          onClick={() => updateQuantity(menu.id, 1)}
                          className="h-10 w-10 border-[2px] border-border bg-background text-foreground rounded-none hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(menu.id, menu.name, menu.price)}
                        disabled={menu.soldOut}
                        className="w-full h-12 border-[3px] border-black bg-black font-mono text-base font-bold uppercase text-white rounded-none hover:bg-white hover:text-black transition-colors"
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        カートに追加
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center font-body text-[16px] py-sp-5">
            メニューがまだ登録されていません
          </p>
        )}
      </div>

      {/* 固定事前オーダーカートバー */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black text-white border-t-[5px] border-black p-4 backdrop-blur-md">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <span className="bg-white text-black px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-widest mr-2">
                選択中 ({getTotalCount()}点)
              </span>
              <span className="font-mono text-2xl font-black">
                合計: ¥{getTotalPrice().toLocaleString()}
              </span>
            </div>
            <Button
              onClick={() => preOrderMutation.mutate()}
              disabled={preOrderMutation.isPending}
              className="w-full sm:w-auto h-14 border-[3px] border-white bg-white px-8 font-mono text-lg font-black uppercase text-black rounded-none hover:bg-[#008000] hover:text-white transition-all shadow-none active:translate-y-1"
            >
              <CheckCircle className="mr-2 h-6 w-6" />
              {preOrderMutation.isPending
                ? "送信中..."
                : "【事前注文を確定する】"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto p-sp-4 font-mono text-[14px] uppercase tracking-[1px]">
          読み込み中...
        </div>
      }
    >
      <MenuPageContent />
    </Suspense>
  );
}
