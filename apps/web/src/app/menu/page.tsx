"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { eventApi, circleApi, menuApi } from "@/lib/api";
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
import Image from "next/image";

function MenuPageContent() {
  const searchParams = useSearchParams();
  const circleIdParam = searchParams.get("circleId");

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(
    circleIdParam
  );

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

  // URLパラメーターでcircleIdが指定されている場合
  useEffect(() => {
    if (circleIdParam) {
      setSelectedCircleId(circleIdParam);
    }
  }, [circleIdParam]);

  // イベント選択画面
  if (!selectedEventId && !selectedCircleId) {
    return (
      <div className="max-w-6xl mx-auto p-sp-4 space-y-sp-5">
        <div className="border-b-[3px] border-black pb-sp-3 mb-sp-5">
          <h1 className="text-[48px] font-headline uppercase tracking-tight leading-[1.0]">
            メニューを見る
          </h1>
          <p className="font-mono text-[14px] uppercase tracking-[1px] mt-sp-1">
            イベントを選択してください
          </p>
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
                className="cursor-pointer hover:bg-black hover:text-white group"
                onClick={() => setSelectedEventId(event.id)}
              >
                <CardHeader>
                  <CardTitle>{event.eventName}</CardTitle>
                  {event.description && (
                    <CardDescription className="group-hover:text-white">
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
                          <>
                            {" "}
                            〜{" "}
                            {new Date(event.endDate).toLocaleDateString(
                              "ja-JP"
                            )}
                          </>
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

        <div className="border-b-[3px] border-black pb-sp-3">
          <Badge variant="default" className="mb-sp-2">
            {selectedEvent?.eventName}
          </Badge>
          <h1 className="text-[48px] font-headline uppercase tracking-tight leading-[1.0]">
            出店一覧
          </h1>
          <p className="font-mono text-[14px] uppercase tracking-[1px] mt-sp-1">
            メニューを見たいお店を選んでください
          </p>
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
                className="cursor-pointer hover:bg-black hover:text-white group"
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
    <div className="max-w-6xl mx-auto p-sp-4 space-y-sp-5">
      {/* 戻るボタン */}
      <button
        onClick={() => {
          setSelectedCircleId(null);
          // URLパラメーターでアクセスしていた場合はイベント選択に戻る
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
          className="relative min-h-[220px] border-[5px] border-black bg-black text-white p-sp-5 flex flex-col justify-center items-center text-center"
          style={circleData.backgroundImagePath ? {
            backgroundImage: `url(${circleData.backgroundImagePath})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          } : undefined}
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
              <p className="text-[15px] font-mono leading-[1.5]">{circleData.description}</p>
            )}
          </div>
        </div>
      )}

      {/* メニュー一覧 */}
      <div>
        <h2 className="text-[32px] font-headline uppercase tracking-tight mb-sp-3 leading-[1.1]">
          メニュー
        </h2>
        {menus && menus.length > 0 ? (
          <div className="grid gap-sp-3 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
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
                        <span className="font-mono text-[14px] uppercase tracking-[1px]">No Image</span>
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
                  {menu.stockQuantity != null && menu.stockQuantity > 0 && (
                    <p className="text-[12px] font-mono uppercase tracking-[1px]">
                      在庫: {menu.stockQuantity}個
                    </p>
                  )}
                </CardContent>
                {menu.toppings && menu.toppings.length > 0 && (
                  <CardFooter>
                    <div className="w-full border-t-[2px] border-black pt-sp-2">
                      <p className="text-[12px] font-headline uppercase tracking-[1px] mb-sp-2">
                        トッピング:
                      </p>
                      <div className="space-y-1">
                        {menu.toppings.map((topping) => (
                          <div
                            key={topping.id}
                            className="flex justify-between text-[13px] font-mono"
                          >
                            <span>{topping.name}</span>
                            <span>+¥{topping.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center font-body text-[16px] py-sp-5">
            メニューがまだ登録されていません
          </p>
        )}
      </div>
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
