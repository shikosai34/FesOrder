import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, circle, event } from "@new-modern-app/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const circleRoutes = new Hono();

// サークル一覧取得
circleRoutes.get("/", async (c) => {
  const eventId = c.req.query("eventId");

  if (eventId) {
    const circles = await db
      .select()
      .from(circle)
      .where(eq(circle.eventId, eventId));
    return c.json(circles.map((c) => ({ ...c, password: undefined })));
  }

  const circles = await db.select().from(circle);
  return c.json(circles.map((c) => ({ ...c, password: undefined })));
});

// サークル取得
circleRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const circles = await db.select().from(circle).where(eq(circle.id, id));

  if (circles.length === 0) {
    return c.json({ error: "サークルが見つかりません" }, 404);
  }

  const foundCircle = circles[0]!;
  return c.json({ ...foundCircle, password: undefined });
});

// サークル作成
circleRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      eventId: z.string(),
      name: z.string().min(1, "サークル名は必須です"),
      password: z.string().min(4, "パスワードは4文字以上必要です"),
      description: z.string().optional(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");
    const id = nanoid();

    // イベントの存在確認
    const events = await db
      .select()
      .from(event)
      .where(eq(event.id, input.eventId));
    if (events.length === 0) {
      return c.json({ error: "イベントが見つかりません" }, 404);
    }

    // 同じイベント内で同じ名前のサークルがないか確認
    const existingCircles = await db
      .select()
      .from(circle)
      .where(
        and(eq(circle.eventId, input.eventId), eq(circle.name, input.name))
      );

    if (existingCircles.length > 0) {
      return c.json({ error: "同じ名前のサークルが既に存在します" }, 400);
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(input.password, 10);

    await db.insert(circle).values({
      id,
      eventId: input.eventId,
      name: input.name,
      password: hashedPassword,
      description: input.description,
    });

    return c.json({ id }, 201);
  }
);

// サークル更新
circleRoutes.put(
  "/:id",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      password: z.string().min(4).optional(),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");

    const updates: Partial<typeof circle.$inferSelect> = {};

    if (input.name) updates.name = input.name;
    if (input.description !== undefined)
      updates.description = input.description;
    if (input.password) {
      updates.password = await bcrypt.hash(input.password, 10);
    }

    await db.update(circle).set(updates).where(eq(circle.id, id));

    return c.json({ success: true });
  }
);

// サークル削除
circleRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(circle).where(eq(circle.id, id));
  return c.json({ success: true });
});

export default circleRoutes;
