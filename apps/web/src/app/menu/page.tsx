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
import { ArrowLeft, Calendar, Store, UtensilsCrossed } from "lucide-react";
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
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">メニューを見る</h1>
          <p className="text-muted-foreground">イベントを選択してください</p>
        </div>

        {eventsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={event.id}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => setSelectedEventId(event.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    {event.eventName}
                  </CardTitle>
                  {event.description && (
                    <CardDescription>{event.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
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
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
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
      <div className="container mx-auto p-4 space-y-6">
        <Button
          variant="ghost"
          onClick={() => setSelectedEventId(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          イベント選択に戻る
        </Button>

        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-2">
            {selectedEvent?.eventName}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">出店一覧</h1>
          <p className="text-muted-foreground">
            メニューを見たいお店を選んでください
          </p>
        </div>

        {circlesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : circles && circles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {circles.map((circle) => (
              <Card
                key={circle.id}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => setSelectedCircleId(circle.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {circle.iconImagePath ? (
                      <Image
                        src={circle.iconImagePath}
                        alt={circle.name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle>{circle.name}</CardTitle>
                      {circle.description && (
                        <CardDescription className="line-clamp-2">
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
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
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
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* 戻るボタン */}
      <Button
        variant="ghost"
        onClick={() => {
          setSelectedCircleId(null);
          // URLパラメーターでアクセスしていた場合はイベント選択に戻る
          if (circleIdParam) {
            setSelectedEventId(null);
          }
        }}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        出店一覧に戻る
      </Button>

      {/* サークル情報ヘッダー */}
      {circleData && (
        <div
          className="relative h-64 rounded-lg overflow-hidden"
          style={{
            backgroundImage: circleData.backgroundImagePath
              ? `url(${circleData.backgroundImagePath})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-center text-white">
              {circleData.iconImagePath && (
                <Image
                  src={circleData.iconImagePath}
                  alt={circleData.name}
                  width={100}
                  height={100}
                  className="mx-auto rounded-full mb-4"
                />
              )}
              <h1 className="text-4xl font-bold mb-2">{circleData.name}</h1>
              {circleData.description && (
                <p className="text-lg">{circleData.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* メニュー一覧 */}
      <div>
        <h2 className="text-2xl font-bold mb-4">メニュー</h2>
        {menus && menus.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <Card key={menu.id} className={menu.soldOut ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="relative h-48 w-full rounded-t-lg overflow-hidden">
                    {menu.imagePath ? (
                      <Image
                        src={menu.imagePath}
                        alt={menu.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                    {menu.soldOut && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          売り切れ
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-2">{menu.name}</CardTitle>
                  <p className="text-2xl font-bold text-primary mb-2">
                    ¥{menu.price.toLocaleString()}
                  </p>
                  {menu.description && (
                    <CardDescription className="mb-2">
                      {menu.description}
                    </CardDescription>
                  )}
                  {menu.stockQuantity != null && menu.stockQuantity > 0 && (
                    <p className="text-sm text-muted-foreground">
                      在庫: {menu.stockQuantity}個
                    </p>
                  )}
                </CardContent>
                {menu.toppings && menu.toppings.length > 0 && (
                  <CardFooter>
                    <div className="w-full">
                      <p className="text-sm font-semibold mb-2">トッピング:</p>
                      <div className="space-y-1">
                        {menu.toppings.map((topping) => (
                          <div
                            key={topping.id}
                            className="flex justify-between text-sm"
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
          <p className="text-center text-muted-foreground">
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
      fallback={<div className="container mx-auto p-4">読み込み中...</div>}
    >
      <MenuPageContent />
    </Suspense>
  );
}
