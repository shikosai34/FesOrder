import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db, membership, inviteToken, circle, event } from "@new-modern-app/db";
import { eq, and, inArray, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const membershipRoutes = new Hono();

// ロール定義
const ROLES = [
  "owner",
  "admin",
  "manager",
  "cashier",
  "kitchen",
  "server",
  "viewer",
] as const;

type Role = (typeof ROLES)[number];

// ロールの権限マッピング
const ROLE_PERMISSIONS: Record<Role, string[]> = {
  owner: ["*"], // 全権限
  admin: [
    "manage_members",
    "manage_menu",
    "manage_orders",
    "manage_staff",
    "view_sales",
    "manage_settings",
  ],
  manager: ["manage_menu", "manage_orders", "manage_staff", "view_sales"],
  cashier: ["create_order", "view_orders", "complete_order"],
  kitchen: ["view_orders", "update_order_status"],
  server: ["view_orders", "complete_order"],
  viewer: ["view_menu", "view_orders"],
};

// 権限チェック関数
function hasPermission(role: Role, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes("*") || permissions.includes(permission);
}

// ロール一覧取得
membershipRoutes.get("/roles", (c) => {
  return c.json(
    ROLES.map((role) => ({
      role,
      permissions: ROLE_PERMISSIONS[role],
    }))
  );
});

// 自分のメンバーシップ一覧取得
membershipRoutes.get("/my", async (c) => {
  const userEmail = c.req.query("userEmail");

  if (!userEmail) {
    return c.json({ error: "userEmailが必要です" }, 400);
  }

  const memberships = await db
    .select()
    .from(membership)
    .where(
      and(eq(membership.userEmail, userEmail), eq(membership.isActive, true))
    );

  // サークルとイベント情報を取得
  const circleIds = memberships
    .map((m) => m.circleId)
    .filter(Boolean) as string[];
  const eventIds = memberships
    .map((m) => m.eventId)
    .filter(Boolean) as string[];

  const circles =
    circleIds.length > 0
      ? await db.select().from(circle).where(inArray(circle.id, circleIds))
      : [];

  const events =
    eventIds.length > 0
      ? await db.select().from(event).where(inArray(event.id, eventIds))
      : [];

  const result = memberships.map((m) => ({
    ...m,
    circle: circles.find((c) => c.id === m.circleId),
    event: events.find((e) => e.id === m.eventId),
  }));

  return c.json(result);
});

// サークルのメンバー一覧取得
membershipRoutes.get("/circle/:circleId", async (c) => {
  const circleId = c.req.param("circleId");

  const memberships = await db
    .select()
    .from(membership)
    .where(eq(membership.circleId, circleId));

  return c.json(memberships);
});

// イベントのメンバー一覧取得
membershipRoutes.get("/event/:eventId", async (c) => {
  const eventId = c.req.param("eventId");

  const memberships = await db
    .select()
    .from(membership)
    .where(eq(membership.eventId, eventId));

  return c.json(memberships);
});

// 権限チェック
membershipRoutes.post(
  "/check-permission",
  zValidator(
    "json",
    z.object({
      userEmail: z.string(),
      circleId: z.string().optional(),
      eventId: z.string().optional(),
      permission: z.string(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");

    // メンバーシップを検索
    let membershipQuery;
    if (input.circleId) {
      membershipQuery = db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.userEmail, input.userEmail),
            eq(membership.circleId, input.circleId),
            eq(membership.isActive, true)
          )
        );
    } else if (input.eventId) {
      membershipQuery = db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.userEmail, input.userEmail),
            eq(membership.eventId, input.eventId),
            eq(membership.isActive, true)
          )
        );
    } else {
      return c.json({ error: "circleIdまたはeventIdが必要です" }, 400);
    }

    const memberships = await membershipQuery;

    if (memberships.length === 0) {
      return c.json({ hasPermission: false });
    }

    const userMembership = memberships[0]!;
    const has = hasPermission(userMembership.role as Role, input.permission);

    return c.json({ hasPermission: has, role: userMembership.role });
  }
);

// メンバー追加
membershipRoutes.post(
  "/",
  zValidator(
    "json",
    z.object({
      userEmail: z.string(),
      userName: z.string(),
      circleId: z.string().optional(),
      eventId: z.string().optional(),
      role: z.enum(ROLES),
      pin: z.string().optional(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");
    const id = nanoid();

    // PINをハッシュ化
    let pinHash: string | null = null;
    if (input.pin) {
      pinHash = await bcrypt.hash(input.pin, 10);
    }

    await db.insert(membership).values({
      id,
      userEmail: input.userEmail,
      userName: input.userName,
      circleId: input.circleId,
      eventId: input.eventId,
      role: input.role,
      pin: pinHash,
      isActive: true,
    });

    return c.json({ id }, 201);
  }
);

// ロール更新
membershipRoutes.patch(
  "/:id/role",
  zValidator(
    "json",
    z.object({
      role: z.enum(ROLES),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");

    await db
      .update(membership)
      .set({ role: input.role })
      .where(eq(membership.id, id));

    return c.json({ success: true });
  }
);

// メンバー無効化
membershipRoutes.patch("/:id/deactivate", async (c) => {
  const id = c.req.param("id");

  await db
    .update(membership)
    .set({ isActive: false })
    .where(eq(membership.id, id));

  return c.json({ success: true });
});

// メンバー削除
membershipRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");

  await db.delete(membership).where(eq(membership.id, id));

  return c.json({ success: true });
});

// 招待トークン作成
membershipRoutes.post(
  "/invite",
  zValidator(
    "json",
    z.object({
      circleId: z.string().optional(),
      eventId: z.string().optional(),
      role: z.enum(ROLES),
      expiresInHours: z.number().min(1).max(168).default(24), // 1時間〜7日
      maxUses: z.number().min(1).max(100).optional(),
      createdBy: z.string(), // 作成者のメールアドレス
    })
  ),
  async (c) => {
    const input = c.req.valid("json");
    const id = nanoid();
    const token = nanoid(32);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + input.expiresInHours);

    await db.insert(inviteToken).values({
      id,
      token,
      circleId: input.circleId,
      eventId: input.eventId,
      role: input.role,
      expiresAt,
      maxUses: input.maxUses,
      usedCount: 0,
      createdBy: input.createdBy,
    });

    return c.json({ token, expiresAt }, 201);
  }
);

// 招待を受け入れ
membershipRoutes.post(
  "/invite/accept",
  zValidator(
    "json",
    z.object({
      token: z.string(),
      userEmail: z.string(),
      userName: z.string(),
      pin: z.string().optional(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");

    // トークンを検索
    const tokens = await db
      .select()
      .from(inviteToken)
      .where(
        and(
          eq(inviteToken.token, input.token),
          gt(inviteToken.expiresAt, new Date())
        )
      );

    if (tokens.length === 0) {
      return c.json({ error: "無効または期限切れの招待トークンです" }, 400);
    }

    const foundToken = tokens[0]!;

    // 使用回数チェック
    if (
      foundToken.maxUses !== null &&
      foundToken.usedCount >= foundToken.maxUses
    ) {
      return c.json({ error: "招待トークンの使用回数上限に達しました" }, 400);
    }

    // 既存のメンバーシップをチェック
    const existingMembership = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.userEmail, input.userEmail),
          foundToken.circleId
            ? eq(membership.circleId, foundToken.circleId)
            : foundToken.eventId
            ? eq(membership.eventId, foundToken.eventId)
            : undefined
        )
      );

    if (existingMembership.length > 0) {
      return c.json({ error: "既にメンバーとして登録されています" }, 400);
    }

    // PINをハッシュ化
    let pinHash: string | null = null;
    if (input.pin) {
      pinHash = await bcrypt.hash(input.pin, 10);
    }

    // メンバーシップを作成
    const membershipId = nanoid();
    await db.insert(membership).values({
      id: membershipId,
      userEmail: input.userEmail,
      userName: input.userName,
      circleId: foundToken.circleId,
      eventId: foundToken.eventId,
      role: foundToken.role,
      pin: pinHash,
      isActive: true,
    });

    // トークンの使用回数を更新
    await db
      .update(inviteToken)
      .set({ usedCount: foundToken.usedCount + 1 })
      .where(eq(inviteToken.id, foundToken.id));

    return c.json({ membershipId }, 201);
  }
);

// 招待トークン一覧取得
membershipRoutes.get("/invite/list", async (c) => {
  const circleId = c.req.query("circleId");
  const eventId = c.req.query("eventId");

  let query;
  if (circleId) {
    query = db
      .select()
      .from(inviteToken)
      .where(eq(inviteToken.circleId, circleId));
  } else if (eventId) {
    query = db
      .select()
      .from(inviteToken)
      .where(eq(inviteToken.eventId, eventId));
  } else {
    return c.json({ error: "circleIdまたはeventIdが必要です" }, 400);
  }

  const tokens = await query;

  // 期限切れのトークンを除外
  const activeTokens = tokens.filter((t) => new Date(t.expiresAt) > new Date());

  return c.json(activeTokens);
});

// 招待トークン削除
membershipRoutes.delete("/invite/:id", async (c) => {
  const id = c.req.param("id");

  await db.delete(inviteToken).where(eq(inviteToken.id, id));

  return c.json({ success: true });
});

// PIN認証
membershipRoutes.post(
  "/authenticate-pin",
  zValidator(
    "json",
    z.object({
      circleId: z.string().optional(),
      eventId: z.string().optional(),
      pin: z.string(),
    })
  ),
  async (c) => {
    const input = c.req.valid("json");

    // メンバーシップを検索
    let query;
    if (input.circleId) {
      query = db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.circleId, input.circleId),
            eq(membership.isActive, true)
          )
        );
    } else if (input.eventId) {
      query = db
        .select()
        .from(membership)
        .where(
          and(
            eq(membership.eventId, input.eventId),
            eq(membership.isActive, true)
          )
        );
    } else {
      return c.json({ error: "circleIdまたはeventIdが必要です" }, 400);
    }

    const memberships = await query;

    // PINがnullでないメンバーシップをチェック
    for (const m of memberships) {
      if (m.pin) {
        const isValid = await bcrypt.compare(input.pin, m.pin);
        if (isValid) {
          return c.json({
            success: true,
            membership: {
              ...m,
              pin: undefined,
            },
          });
        }
      }
    }

    return c.json({ error: "PINが正しくありません" }, 401);
  }
);

// PIN更新
membershipRoutes.patch(
  "/:id/pin",
  zValidator(
    "json",
    z.object({
      pin: z.string().min(4, "PINは4文字以上必要です"),
    })
  ),
  async (c) => {
    const id = c.req.param("id");
    const input = c.req.valid("json");

    const pinHash = await bcrypt.hash(input.pin, 10);

    await db
      .update(membership)
      .set({ pin: pinHash })
      .where(eq(membership.id, id));

    return c.json({ success: true });
  }
);

export default membershipRoutes;
