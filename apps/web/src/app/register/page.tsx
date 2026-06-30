"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CircleAuthGuard } from "@/hooks/useCircleAuth";
import { menuApi, toppingApi, orderApi, circleApi } from "@/lib/api";
import { QrScannerModal } from "@/components/pos/qr-scanner-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2, QrCode } from "lucide-react";

interface CartItem {
  menuId: string;
  menuName: string;
  menuPrice: number;
  quantity: number;
  toppings: {
    toppingId: string;
    toppingName: string;
    toppingPrice: number;
  }[];
}

function RegisterPageContent() {
  const [circleId, setCircleId] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [peopleCount, setPeopleCount] = useState(1);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);


  useEffect(() => {
    const storedCircleId = localStorage.getItem("circleId");
    if (storedCircleId) {
      setCircleId(storedCircleId);
    }
  }, []);

  const { data: circle } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => circleApi.get(circleId),
    enabled: !!circleId,
  });

  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ["menus", circleId],
    queryFn: () => menuApi.list(circleId),
    enabled: !!circleId,
  });



  const { data: toppings } = useQuery({
    queryKey: ["toppings", circleId],
    queryFn: () => toppingApi.list(circleId),
    enabled: !!circleId,
  });

  const createOrder = useMutation({
    mutationFn: async (input: {
      circleId: string;
      peopleCount: number;
      items: { menuId: string; quantity: number; toppingIds?: string[] }[];
      notes?: string;
    }) => {
      return await orderApi.create(input);
    },
    onSuccess: (data) => {
      toast.success(`注文が完了しました！注文番号: ${data.orderNumber}`);
      setCart([]);
      setPeopleCount(1);
    },
    onError: (error: any) => {
      toast.error(error.message || "注文に失敗しました");
    },
  });

  const isPreOrderEnabled = () => {
    if (!circle || !circle.mods) return false;
    try {
      const parsed = JSON.parse(circle.mods);
      const preOrderMod = parsed.installed?.["circle-pre-order-cod"];
      return preOrderMod?.enabled ?? false;
    } catch (e) {
      return false;
    }
  };

  const preOrderActive = isPreOrderEnabled();

  const getActiveMods = () => {
    if (!circle || !circle.mods) return [];
    try {
      const parsed = JSON.parse(circle.mods);
      return Object.values(parsed.installed || {}).filter((m: any) => m.enabled);
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).FesOrderRegister = {
        circleId,
        circle,
        menus,
        toppings,
      };
    }
  }, [circleId, circle, menus, toppings]);

  const addToCart = (menuId: string, menuName: string, menuPrice: number) => {
    const existingItem = cart.find((item) => item.menuId === menuId);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.menuId === menuId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        { menuId, menuName, menuPrice, quantity: 1, toppings: [] },
      ]);
    }
    toast.success(`${menuName}をカートに追加しました`);
  };

  const removeFromCart = (menuId: string) => {
    setCart(cart.filter((item) => item.menuId !== menuId));
  };

  const updateQuantity = (menuId: string, delta: number) => {
    setCart(
      cart
        .map((item) =>
          item.menuId === menuId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const addToppingToItem = (
    menuId: string,
    toppingId: string,
    toppingName: string,
    toppingPrice: number
  ) => {
    setCart(
      cart.map((item) => {
        if (item.menuId === menuId) {
          const hasToppingAlready = item.toppings.some(
            (t) => t.toppingId === toppingId
          );
          if (hasToppingAlready) {
            return {
              ...item,
              toppings: item.toppings.filter((t) => t.toppingId !== toppingId),
            };
          } else {
            return {
              ...item,
              toppings: [
                ...item.toppings,
                { toppingId, toppingName, toppingPrice },
              ],
            };
          }
        }
        return item;
      })
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item.menuPrice * item.quantity;
      const toppingsPrice =
        item.toppings.reduce((sum, topping) => sum + topping.toppingPrice, 0) *
        item.quantity;
      return total + itemPrice + toppingsPrice;
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      toast.error("カートが空です");
      return;
    }

    await createOrder.mutateAsync({
      circleId,
      peopleCount,
      items: cart.map((item) => ({
        menuId: item.menuId,
        quantity: item.quantity,
        toppingIds: item.toppings.map((t) => t.toppingId),
      })),
    });
  };

  const clearCart = () => {
    setCart([]);
    toast.info("カートをクリアしました");
  };

  if (menusLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <QrScannerModal
        circleId={circleId}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メニュー一覧 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-primary p-4 text-primary-foreground border-[3px] border-border">
            <h1 className="font-mono text-2xl font-black uppercase tracking-wider">
              [レジ - 注文入力]
            </h1>
            {preOrderActive && (
              <Button
                variant="accent"
                onClick={() => setIsQrModalOpen(true)}
                className="h-12 uppercase tracking-wider"
              >
                <QrCode className="mr-2 h-5 w-5" />
                [QR / リストバンド照会]
              </Button>
            )}
            {getActiveMods().map((mod: any) => (
              mod.manifest?.hooks?.registerAction ? (
                <div
                  key={`${mod.manifest.id}-register-action`}
                  dangerouslySetInnerHTML={{ __html: mod.manifest.hooks.registerAction }}
                />
              ) : null
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">

            {menus?.map((menu) => (
              <Card key={menu.id} className={menu.soldOut ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="relative h-40 w-full overflow-hidden">
                    {menu.imagePath ? (
                      <Image
                        src={menu.imagePath}
                        alt={menu.name}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <span className="text-muted-foreground/50 font-medium">No Image</span>
                      </div>
                    )}
                    {menu.soldOut && (
                      <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full text-sm font-bold shadow-sm backdrop-blur-sm">
                        売り切れ
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-1">{menu.name}</CardTitle>
                  <p className="text-xl font-bold text-primary">
                    ¥{menu.price.toLocaleString()}
                  </p>
                  {menu.stockQuantity != null && menu.stockQuantity > 0 && (
                    <p className="text-sm text-muted-foreground">
                      在庫: {menu.stockQuantity}個
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => addToCart(menu.id, menu.name, menu.price)}
                    disabled={menu.soldOut}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    カートに追加
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* カート */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 glass-card border-primary/20 shadow-lg h-[calc(100vh-6rem)] flex flex-col">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                カート
              </CardTitle>
              <CardDescription>{cart.length}個の商品</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                  <p>カートが空です</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {cart.map((item) => (
                      <div
                        key={item.menuId}
                        className="bg-card border rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{item.menuName}</p>
                            <p className="text-sm text-muted-foreground">
                              ¥{item.menuPrice.toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.menuId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* トッピング選択 */}
                        {toppings && toppings.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold">トッピング:</p>
                            {toppings.map((topping) => (
                              <label
                                key={topping.id}
                                className="flex items-center space-x-2 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.toppings.some(
                                    (t) => t.toppingId === topping.id
                                  )}
                                  onChange={() =>
                                    addToppingToItem(
                                      item.menuId,
                                      topping.id,
                                      topping.name,
                                      topping.price
                                    )
                                  }
                                  disabled={topping.soldOut}
                                />
                                <span>
                                  {topping.name} (+¥{topping.price})
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* 数量調整 */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-3 bg-secondary/50 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-md hover:bg-background"
                              onClick={() => updateQuantity(item.menuId, -1)}
                            >
                              <Minus className="h-5 w-5" />
                            </Button>
                            <span className="font-bold text-lg w-8 text-center tabular-nums">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-md hover:bg-background"
                              onClick={() => updateQuantity(item.menuId, 1)}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                          <p className="font-semibold">
                            ¥
                            {(
                              (item.menuPrice +
                                item.toppings.reduce(
                                  (sum, t) => sum + t.toppingPrice,
                                  0
                                )) *
                              item.quantity
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 人数入力 */}
                  <div className="space-y-2 bg-secondary/20 p-4 rounded-xl mt-4">
                    <Label htmlFor="peopleCount" className="text-sm font-bold">来店人数</Label>
                    <Input
                      id="peopleCount"
                      type="number"
                      min="1"
                      className="text-lg text-center font-bold h-12"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(Number(e.target.value))}
                    />
                  </div>

                  {/* 合計金額 */}
                  <div className="border-t pt-4 mt-2">
                    <div className="flex justify-between items-end text-xl">
                      <span className="text-muted-foreground font-medium">合計金額</span>
                      <span className="text-3xl font-black text-primary">¥{getTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 bg-background/50 backdrop-blur-md pt-4 border-t mt-auto rounded-b-xl">
              <Button
                className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || createOrder.isPending}
              >
                {createOrder.isPending ? "注文中..." : "注文を確定"}
              </Button>
              {cart.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearCart}
                >
                  カートをクリア
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* 外部モッドの動的ボディ末尾インジェクション */}
      {getActiveMods().map((mod: any) => (
        mod.manifest?.hooks?.registerBodyBottom ? (
          <div
            key={`${mod.manifest.id}-register-body-bottom`}
            style={{ display: "none" }}
            dangerouslySetInnerHTML={{ __html: mod.manifest.hooks.registerBodyBottom }}
          />
        ) : null
      ))}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <CircleAuthGuard>
      <RegisterPageContent />
    </CircleAuthGuard>
  );
}
