import "dotenv/config";
import { auth } from "@new-modern-app/auth";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";

// Hono REST APIルート
import {
  eventRoutes,
  circleRoutes,
  menuRoutes,
  toppingRoutes,
  staffRoutes,
  orderRoutes,
  membershipRoutes,
} from "./routes";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: process.env.CORS_ORIGIN || "",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Better Auth
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// REST APIルートを登録
app.route("/api/events", eventRoutes);
app.route("/api/circles", circleRoutes);
app.route("/api/menus", menuRoutes);
app.route("/api/toppings", toppingRoutes);
app.route("/api/staff", staffRoutes);
app.route("/api/orders", orderRoutes);
app.route("/api/memberships", membershipRoutes);

// 画像アップロードエンドポイント
app.post("/api/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      return c.json({ error: "ファイルがありません" }, 400);
    }

    // ファイル形式チェック
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "許可されていないファイル形式です" }, 400);
    }

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "ファイルサイズは5MB以下にしてください" }, 400);
    }

    // ファイル名生成
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${nanoid()}.${ext}`;

    // 保存先ディレクトリ
    const uploadDir = path.join(process.cwd(), "../web/public/uploads");

    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // ファイル保存
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);

    // 公開パスを返す
    const publicPath = `/uploads/${fileName}`;

    return c.json({ path: publicPath, fileName });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "アップロードに失敗しました" }, 500);
  }
});

app.get("/", (c) => {
  return c.text("OK");
});

import { serve } from "@hono/node-server";

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
