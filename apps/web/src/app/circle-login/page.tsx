"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { eventApi, membershipApi } from "@/lib/api";
import { saveAuthInfo, type RoleType } from "@/hooks/useCircleAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { KeyRound, Users } from "lucide-react";

export default function CircleLoginPage() {
  const router = useRouter();
  const [eventName, setEventName] = useState("");
  const [circleName, setCircleName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // PIN認証用
  const [pinEmail, setPinEmail] = useState("");
  const [pin, setPin] = useState("");
  const [pinCircleId, setPinCircleId] = useState("");

  // サークルパスワード認証
  const getCircleId = useMutation({
    mutationFn: async (input: {
      eventName: string;
      circleName: string;
      password: string;
    }) => {
      return await eventApi.login(input);
    },
    onSuccess: (data) => {
      // 認証情報を保存（ロール情報付き）
      saveAuthInfo({
        circleId: data.circleId,
        eventId: data.eventId,
        userEmail: null,
        userName: null,
        role: "circle_manager" as RoleType, // サークルパスワードでログインした場合はマネージャー権限
        membershipId: null,
      });

      // 後方互換性のため
      localStorage.setItem("circleName", data.circleName);
      localStorage.setItem("eventName", data.eventName);

      toast.success("ログインしました");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "ログインに失敗しました");
      setIsLoading(false);
    },
  });

  // PIN認証
  const authenticateWithPin = useMutation({
    mutationFn: async (input: {
      userEmail: string;
      pin: string;
      circleId: string;
    }) => {
      const result = await membershipApi.authenticateWithPin({
        circleId: input.circleId,
        pin: input.pin,
      });
      if (!result.success || !result.membership || !result.user) {
        throw new Error("認証に失敗しました");
      }
      return {
        membershipId: result.membership.id,
        userName: result.user.name,
        role: result.membership.role,
      };
    },
    onSuccess: (data) => {
      // 認証情報を保存
      saveAuthInfo({
        circleId: pinCircleId,
        eventId: null,
        userEmail: pinEmail,
        userName: data.userName,
        role: data.role as RoleType,
        membershipId: data.membershipId,
      });

      toast.success(`${data.userName}さん、ようこそ！`);
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.message || "認証に失敗しました");
      setIsLoading(false);
    },
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await getCircleId.mutateAsync({
        eventName,
        circleName,
        password,
      });
    } catch (error) {
      // エラーはonErrorで処理される
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authenticateWithPin.mutateAsync({
        userEmail: pinEmail,
        pin,
        circleId: pinCircleId,
      });
    } catch (error) {
      // エラーはonErrorで処理される
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>
            サークルにログインして管理を開始しましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                サークル
              </TabsTrigger>
              <TabsTrigger value="pin" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                PIN
              </TabsTrigger>
            </TabsList>

            {/* サークルパスワード認証 */}
            <TabsContent value="password">
              <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="eventName">イベント名</Label>
                  <Input
                    id="eventName"
                    type="text"
                    placeholder="例: 茨香祭2024"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="circleName">サークル名</Label>
                  <Input
                    id="circleName"
                    type="text"
                    placeholder="例: 2年1組"
                    value={circleName}
                    onChange={(e) => setCircleName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="パスワードを入力"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </TabsContent>

            {/* PIN認証 */}
            <TabsContent value="pin">
              <form onSubmit={handlePinSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="pinCircleId">サークルID</Label>
                  <Input
                    id="pinCircleId"
                    type="text"
                    placeholder="サークルIDを入力"
                    value={pinCircleId}
                    onChange={(e) => setPinCircleId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    管理者から共有されたサークルIDを入力してください
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pinEmail">メールアドレス</Label>
                  <Input
                    id="pinEmail"
                    type="email"
                    placeholder="example@email.com"
                    value={pinEmail}
                    onChange={(e) => setPinEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    placeholder="4-6桁のPINを入力"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "認証中..." : "PINでログイン"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
