import { z } from "zod";
import { router, publicProcedure } from "../index";
import { db, order, orderItem, orderItemTopping } from "@new-modern-app/db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export const orderRouter = router({
  // 注文一覧取得
  list: publicProcedure
    .input(
      z.object({
        circleId: z.string(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const whereClause = input.status
        ? and(
            eq(order.circleId, input.circleId),
            eq(order.status, input.status)
          )
        : eq(order.circleId, input.circleId);

      const orders = await db.query.order.findMany({
        where: whereClause,
        with: {
          orderItems: {
            with: {
              orderItemToppings: true,
            },
          },
        },
        orderBy: [desc(order.createdAt)],
      });

      return orders;
    }),

  // 注文詳細取得
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const orderData = await db.query.order.findFirst({
        where: eq(order.id, input.id),
        with: {
          orderItems: {
            with: {
              orderItemToppings: true,
            },
          },
        },
      });

      if (!orderData) {
        throw new Error("注文が見つかりません");
      }

      return orderData;
    }),

  // 注文番号で検索
  getByOrderNumber: publicProcedure
    .input(z.object({ orderNumber: z.string() }))
    .query(async ({ input }) => {
      const orderData = await db.query.order.findFirst({
        where: eq(order.orderNumber, input.orderNumber),
        with: {
          orderItems: {
            with: {
              orderItemToppings: true,
            },
          },
        },
      });

      if (!orderData) {
        throw new Error("注文が見つかりません");
      }

      return orderData;
    }),

  // 注文作成
  create: publicProcedure
    .input(
      z.object({
        circleId: z.string(),
        peopleCount: z.number(),
        cashierId: z.string().optional(),
        items: z.array(
          z.object({
            menuId: z.string(),
            menuName: z.string(),
            menuPrice: z.number(),
            quantity: z.number(),
            toppings: z
              .array(
                z.object({
                  toppingId: z.string(),
                  toppingName: z.string(),
                  toppingPrice: z.number(),
                })
              )
              .optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const orderId = nanoid();
      const orderNumber = `ORD-${Date.now()}-${nanoid(6)}`;

      // 合計金額を計算
      let totalPrice = 0;
      for (const item of input.items) {
        totalPrice += item.menuPrice * item.quantity;
        if (item.toppings) {
          for (const topping of item.toppings) {
            totalPrice += topping.toppingPrice * item.quantity;
          }
        }
      }

      // 注文を作成
      await db.insert(order).values({
        id: orderId,
        circleId: input.circleId,
        orderNumber,
        peopleCount: input.peopleCount,
        totalPrice,
        status: "pending",
        cashierId: input.cashierId,
      });

      // 注文アイテムを作成
      for (const item of input.items) {
        const orderItemId = nanoid();

        await db.insert(orderItem).values({
          id: orderItemId,
          orderId,
          menuId: item.menuId,
          menuName: item.menuName,
          menuPrice: item.menuPrice,
          quantity: item.quantity,
        });

        // トッピングを追加
        if (item.toppings && item.toppings.length > 0) {
          await db.insert(orderItemTopping).values(
            item.toppings.map((topping) => ({
              id: nanoid(),
              orderItemId,
              toppingId: topping.toppingId,
              toppingName: topping.toppingName,
              toppingPrice: topping.toppingPrice,
            }))
          );
        }
      }

      return { id: orderId, orderNumber };
    }),

  // 注文ステータス更新
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["pending", "preparing", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = { status: input.status };

      if (input.status === "completed") {
        updateData.completed = true;
        updateData.completedAt = new Date();
      }

      await db.update(order).set(updateData).where(eq(order.id, input.id));

      return { success: true };
    }),

  // 注文完成
  complete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .update(order)
        .set({
          status: "completed",
          completed: true,
          completedAt: new Date(),
        })
        .where(eq(order.id, input.id));

      return { success: true };
    }),

  // 予想時間設定
  setEstimatedTime: publicProcedure
    .input(
      z.object({
        id: z.string(),
        estimatedTime: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await db
        .update(order)
        .set({ estimatedTime: input.estimatedTime })
        .where(eq(order.id, input.id));

      return { success: true };
    }),

  // 売上統計取得
  getSalesStats: publicProcedure
    .input(
      z.object({
        circleId: z.string(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input }) => {
      // 基本的な統計情報を取得
      const orders = await db.query.order.findMany({
        where: eq(order.circleId, input.circleId),
      });

      const totalSales = orders.reduce(
        (sum, order) => sum + order.totalPrice,
        0
      );
      const totalOrders = orders.length;
      const completedOrders = orders.filter(
        (order) => order.status === "completed"
      ).length;

      return {
        totalSales,
        totalOrders,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
      };
    }),
});
