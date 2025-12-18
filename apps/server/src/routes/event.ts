import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, event, circle } from "@new-modern-app/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const eventRoutes = new Hono();

// イベント一覧取得
eventRoutes.get("/", async (c) => {
  const events = await db.select().from(event);
  return c.json(events);
});

// イベント取得
eventRoutes.get("/:id", async (c) => {
  const id = c.req.param("id");
  const events = await db.select().from(event).where(eq(event.id, id));

  if (events.length === 0) {
    return c.json({ error: "イベントが見つかりません" }, 404);
  }

  return c.json(events[0]);
});

// イベント作成
eventRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      eventName: z.string().min(1, "イベント名は必須です"),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");
    const id = nanoid();

    await db.insert(event).values({
      id,
      eventName: input.eventName,
      description: input.description,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    });

    return c.json({ id }, 201);
  }
);

// イベント削除
eventRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.delete(event).where(eq(event.id, id));
  return c.json({ success: true });
});

// サークルログイン（イベント名+サークル名+パスワードでサークルIDを取得）
eventRoutes.post(
  "/login",
  zValidator(
    "json",
    z.object({
      eventName: z.string(),
      circleName: z.string(),
      password: z.string(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");

    // イベント名でイベントを検索
    const events = await db
      .select()
      .from(event)
      .where(eq(event.eventName, input.eventName));

    if (events.length === 0) {
      return c.json({ error: "イベントが見つかりません" }, 404);
    }

    const foundEvent = events[0]!;

    // サークル名とイベントIDでサークルを検索
    const circles = await db
      .select()
      .from(circle)
      .where(
        and(
          eq(circle.eventId, foundEvent.id),
          eq(circle.name, input.circleName)
        )
      );

    if (circles.length === 0) {
      return c.json({ error: "サークルが見つかりません" }, 404);
    }

    const foundCircle = circles[0]!;

    // パスワードの検証
    const isPasswordValid = await bcrypt.compare(
      input.password,
      foundCircle.password
    );

    if (!isPasswordValid) {
      return c.json({ error: "パスワードが正しくありません" }, 401);
    }

    return c.json({
      circleId: foundCircle.id,
      circleName: foundCircle.name,
      eventId: foundEvent.id,
      eventName: foundEvent.eventName,
    });
  }
);

export default eventRoutes;
