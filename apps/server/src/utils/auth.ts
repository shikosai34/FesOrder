import { auth } from "@new-modern-app/auth";
import { db, membership } from "@new-modern-app/db";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Context } from "hono";

export async function getAdminSession(c: Context) {
  // Better Auth からセッションを取得
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return null;
  }

  const email = session.user.email;
  const initialAdminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL;

  // 初期管理者メールアドレスに一致する場合、自動昇格/登録チェック
  if (initialAdminEmail && email.toLowerCase() === initialAdminEmail.toLowerCase()) {
    const existing = await db
      .select()
      .from(membership)
      .where(
        and(
          eq(membership.userEmail, email),
          eq(membership.role, "event_admin"),
          eq(membership.isActive, true)
        )
      );

    if (existing.length === 0) {
      // event_admin としてメンバーシップを自動作成
      await db.insert(membership).values({
        id: nanoid(),
        userEmail: email,
        userName: session.user.name || "Super Admin",
        role: "event_admin",
        isActive: true,
      });
    }
    return session;
  }

  // データベースから event_admin 権限を持っているかチェック
  const adminMembership = await db
    .select()
    .from(membership)
    .where(
      and(
        eq(membership.userEmail, email),
        eq(membership.role, "event_admin"),
        eq(membership.isActive, true)
      )
    );

  if (adminMembership.length === 0) {
    return null;
  }

  return session;
}
