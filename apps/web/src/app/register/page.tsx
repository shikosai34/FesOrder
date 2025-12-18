"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CircleAuthGuard } from "@/hooks/useCircleAuth";
import { menuApi, toppingApi, orderApi } from "@/lib/api";
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
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

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

  useEffect(() => {
    const storedCircleId = localStorage.getItem("circleId");
    if (storedCircleId) {
      setCircleId(storedCircleId);
    }
  }, []);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メニュー一覧 */}
        <div className="lg:col-span-2 space-y-4">
          <h1 className="text-3xl font-bold">レジ - 注文入力</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {menus?.map((menu) => (
              <Card key={menu.id} className={menu.soldOut ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="relative h-32 w-full rounded-t-lg overflow-hidden">
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
                        <span className="text-white font-bold">売り切れ</span>
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
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                カート
              </CardTitle>
              <CardDescription>{cart.length}個の商品</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  カートが空です
                </p>
              ) : (
                <>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.menuId}
                        className="border rounded-lg p-3 space-y-2"
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
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.menuId, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="font-semibold w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.menuId, 1)}
                            >
                              <Plus className="h-4 w-4" />
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
                  <div className="space-y-2">
                    <Label htmlFor="peopleCount">人数</Label>
                    <Input
                      id="peopleCount"
                      type="number"
                      min="1"
                      value={peopleCount}
                      onChange={(e) => setPeopleCount(Number(e.target.value))}
                    />
                  </div>

                  {/* 合計金額 */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>合計</span>
                      <span>¥{getTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
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
