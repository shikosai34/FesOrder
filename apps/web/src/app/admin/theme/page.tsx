"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventApi, type EventTheme } from "@/lib/api";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { Palette, Type, Image as ImageIcon, Check, RefreshCw, ArrowLeft, Eye, Upload } from "lucide-react";
import { uploadImage } from "@/lib/api";

export default function AdminThemePage() {
  const queryClient = useQueryClient();
  const { setPreviewTheme } = useTheme();

  const { data: eventData, isLoading } = useQuery({
    queryKey: ["eventTheme", "evt_default"],
    queryFn: () => eventApi.get("evt_default").catch(() => null),
  });

  const [form, setForm] = useState<EventTheme>({
    logoUrl: "",
    fontFamily: "mono",
    customFontUrl: "",
    primaryColor: "#000000",
    primaryTextColor: "#FFFFFF",
    accentColor: "#0000FF",
    accentTextColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    textColor: "#000000",
  });

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFont, setIsUploadingFont] = useState(false);

  useEffect(() => {
    if (eventData) {
      setForm({
        logoUrl: eventData.logoUrl || "",
        fontFamily: eventData.fontFamily || "mono",
        customFontUrl: eventData.customFontUrl || "",
        primaryColor: eventData.primaryColor || "#000000",
        primaryTextColor: eventData.primaryTextColor || "#FFFFFF",
        accentColor: eventData.accentColor || "#0000FF",
        accentTextColor: eventData.accentTextColor || "#FFFFFF",
        backgroundColor: eventData.backgroundColor || "#FFFFFF",
        textColor: eventData.textColor || "#000000",
      });
    }
  }, [eventData]);


  // フォーム変更時にライブプレビューを動的更新
  const handleChange = (key: keyof EventTheme, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    setPreviewTheme(updated);
  };

  // ロゴ画像ファイルアップロード
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await uploadImage(file);
      handleChange("logoUrl", res.path);
      toast.success("ロゴ画像をアップロードしました！");
    } catch (err: any) {
      toast.error(err.message || "ロゴ画像のアップロードに失敗しました");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // フォントファイルアップロード
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFont(true);
    try {
      const res = await uploadImage(file);
      handleChange("customFontUrl", res.path);
      handleChange("fontFamily", "custom");
      toast.success("カスタムフォントをアップロードし適用しました！");
    } catch (err: any) {
      toast.error(err.message || "フォントファイルのアップロードに失敗しました");
    } finally {
      setIsUploadingFont(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: EventTheme) => eventApi.updateTheme("evt_default", data),
    onSuccess: () => {
      toast.success("テーマパックを保存し、アプリ全体に適用しました！");
      queryClient.invalidateQueries({ queryKey: ["eventTheme", "evt_default"] });
      setPreviewTheme(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "テーマの保存に失敗しました");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4 font-mono">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const fonts = [
    { id: "mono", name: "モノスペース (RawBlock Default)" },
    { id: "sans", name: "サンセリフ (Modern Sans)" },
    { id: "serif", name: "セリフ (Classic Serif)" },
    { id: "dotgothic", name: "レトロドット (DotGothic16)" },
    { id: "custom", name: `カスタムフォント (${form.customFontUrl ? "アップロード済み" : "未設定"})` },
  ];

  const presets = [
    { name: "モノクローム (Default)", primary: "#000000", primaryText: "#FFFFFF", accent: "#0000FF", accentText: "#FFFFFF", bg: "#FFFFFF", text: "#000000" },
    { name: "サイバーパンク (Neon)", primary: "#1A0033", primaryText: "#00FF66", accent: "#00FF66", accentText: "#0D001A", bg: "#0D001A", text: "#FFFFFF" },
    { name: "サンセットレトロ (Warm)", primary: "#8B0000", primaryText: "#FFF8DC", accent: "#FF8C00", accentText: "#8B0000", bg: "#FFF8DC", text: "#2F4F4F" },
    { name: "フェスティバルグリーン (Nature)", primary: "#004D40", primaryText: "#E0F2F1", accent: "#00E676", accentText: "#00241B", bg: "#E0F2F1", text: "#00241B" },
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24 font-mono">
      <div className="border-b-[3px] border-border pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/dashboard" className="text-xs uppercase tracking-widest underline hover:text-accent flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> ダッシュボードに戻る
          </Link>
          <span className="bg-primary text-primary-foreground px-2 py-0.5 text-xs font-black uppercase tracking-widest">
            EVENT ADMIN / THEME PACK
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight mt-1">
            [🎨 イベントテーマパックカスタマイズ]
          </h1>
        </div>
        <Button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          variant="accent"
          className="h-12 uppercase"
        >
          <Check className="mr-1.5 h-4 w-4" /> テーマを保存・反映
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 設定フォーム */}
        <div className="space-y-6">
          {/* プリセット一括選択 */}
          <Card className="border-[4px] border-border bg-card rounded-none p-4 shadow-none space-y-3">
            <CardHeader className="p-0 border-b-[2px] border-border pb-2">
              <CardTitle className="text-base font-bold uppercase flex items-center gap-2">
                <Palette className="h-5 w-5" /> カラープリセット選択
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2 grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    handleChange("primaryColor", p.primary);
                    handleChange("primaryTextColor", p.primaryText);
                    handleChange("accentColor", p.accent);
                    handleChange("accentTextColor", p.accentText);
                    handleChange("backgroundColor", p.bg);
                    handleChange("textColor", p.text);
                  }}
                  className="border-[2px] border-border p-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors space-y-1"
                >
                  <p className="text-xs font-bold">{p.name}</p>
                  <div className="flex gap-1">
                    <span className="w-4 h-4 border border-border inline-block" style={{ backgroundColor: p.primary }} />
                    <span className="w-4 h-4 border border-border inline-block" style={{ backgroundColor: p.accent }} />
                    <span className="w-4 h-4 border border-border inline-block" style={{ backgroundColor: p.bg }} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* カラー設定 */}
          <Card className="border-[4px] border-border bg-card rounded-none p-4 shadow-none space-y-4">
            <CardHeader className="p-0 border-b-[2px] border-border pb-2">
              <CardTitle className="text-base font-bold uppercase">カラーパレット詳細設定</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">メイン/枠線カラー</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.primaryColor || "#000000"}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="h-10 w-12 border-[2px] border-border cursor-pointer p-0"
                    />
                    <Input
                      value={form.primaryColor || ""}
                      onChange={(e) => handleChange("primaryColor", e.target.value)}
                      className="h-10 border-[2px] border-border text-xs rounded-none uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">メインカラー上の文字色</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.primaryTextColor || "#FFFFFF"}
                      onChange={(e) => handleChange("primaryTextColor", e.target.value)}
                      className="h-10 w-12 border-[2px] border-border cursor-pointer p-0"
                    />
                    <Input
                      value={form.primaryTextColor || ""}
                      onChange={(e) => handleChange("primaryTextColor", e.target.value)}
                      className="h-10 border-[2px] border-border text-xs rounded-none uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">アクセントカラー</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.accentColor || "#0000FF"}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="h-10 w-12 border-[2px] border-border cursor-pointer p-0"
                    />
                    <Input
                      value={form.accentColor || ""}
                      onChange={(e) => handleChange("accentColor", e.target.value)}
                      className="h-10 border-[2px] border-border text-xs rounded-none uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">アクセントカラー上の文字色</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.accentTextColor || "#FFFFFF"}
                      onChange={(e) => handleChange("accentTextColor", e.target.value)}
                      className="h-10 w-12 border-[2px] border-border cursor-pointer p-0"
                    />
                    <Input
                      value={form.accentTextColor || ""}
                      onChange={(e) => handleChange("accentTextColor", e.target.value)}
                      className="h-10 border-[2px] border-border text-xs rounded-none uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">背景カラー</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.backgroundColor || "#FFFFFF"}
                      onChange={(e) => handleChange("backgroundColor", e.target.value)}
                      className="h-10 w-12 border-[2px] border-border cursor-pointer p-0"
                    />
                    <Input
                      value={form.backgroundColor || ""}
                      onChange={(e) => handleChange("backgroundColor", e.target.value)}
                      className="h-10 border-[2px] border-border text-xs rounded-none uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase block mb-1">背景カラー上の文字色</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.textColor || "#000000"}
                      onChange={(e) => handleChange("textColor", e.target.value)}
                      className="h-10 w-12 border-[2px] border-border cursor-pointer p-0"
                    />
                    <Input
                      value={form.textColor || ""}
                      onChange={(e) => handleChange("textColor", e.target.value)}
                      className="h-10 border-[2px] border-border text-xs rounded-none uppercase"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* フォント＆ロゴ設定 */}
          <Card className="border-[4px] border-border bg-card rounded-none p-4 shadow-none space-y-4">
            <CardHeader className="p-0 border-b-[2px] border-border pb-2">
              <CardTitle className="text-base font-bold uppercase flex items-center gap-2">
                <Type className="h-5 w-5" /> フォント & ロゴ設定
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold uppercase block mb-1">フォントスタイル</label>
                <select
                  value={form.fontFamily || "mono"}
                  onChange={(e) => handleChange("fontFamily", e.target.value)}
                  className="w-full h-11 border-[2px] border-border bg-background text-xs font-bold px-3 rounded-none mb-2"
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>

                <div className="border-[2px] border-dashed border-border p-3 bg-muted space-y-2">
                  <span className="text-xs font-bold uppercase block">📁 オリジナルフォントファイルをアップロード (.ttf, .otf, .woff)</span>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center justify-center h-10 px-4 border-[2px] border-border bg-background hover:bg-accent hover:text-accent-foreground text-xs font-bold uppercase transition-colors">
                      <Upload className="h-4 w-4 mr-1.5" />
                      {isUploadingFont ? "アップロード中..." : "フォントファイルを選択"}
                      <input
                        type="file"
                        accept=".ttf,.otf,.woff,.woff2"
                        onChange={handleFontUpload}
                        className="hidden"
                        disabled={isUploadingFont}
                      />
                    </label>
                    {form.customFontUrl && (
                      <span className="text-[11px] font-mono text-success font-bold">✓ 適用中</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase block mb-1 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" /> イベントロゴ画像 (URL または 直接アップロード)
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={form.logoUrl || ""}
                      onChange={(e) => handleChange("logoUrl", e.target.value)}
                      className="h-11 border-[2px] border-border text-xs rounded-none"
                    />
                    <label className="cursor-pointer inline-flex items-center justify-center h-11 px-4 border-[2px] border-border bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground text-xs font-bold uppercase shrink-0 transition-colors">
                      <Upload className="h-4 w-4 mr-1.5" />
                      {isUploadingLogo ? "中..." : "画像選択"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={isUploadingLogo}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* リアルタイムライブプレビュー */}
        <div className="space-y-4 sticky top-6 self-start">
          <div className="flex items-center gap-2 border-b-[2px] border-border pb-2">
            <Eye className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-black uppercase">[リアルタイムライブプレビュー]</h2>
          </div>

          <div
            className="border-[5px] border-black p-6 space-y-6 transition-all shadow-none"
            style={{
              backgroundColor: form.backgroundColor || "#FFFFFF",
              color: form.textColor || "#000000",
              borderColor: form.primaryColor || "#000000",
            }}
          >
            {/* プレビューヘッダー */}
            <div className="flex justify-between items-center border-b-[3px] pb-3" style={{ borderColor: form.primaryColor || "#000000" }}>
              <div className="flex items-center gap-2">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <span className="font-black text-xl uppercase" style={{ color: form.primaryColor || "#000000" }}>
                    FES_ORDER
                  </span>
                )}
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 uppercase"
                style={{
                  backgroundColor: form.primaryColor || "#000000",
                  color: form.primaryTextColor || "#FFFFFF",
                }}
              >
                PREVIEW MODE
              </span>
            </div>

            {/* プレビューコンテンツ */}
            <div className="space-y-4">
              <div className="border-[3px] p-4 space-y-2" style={{ borderColor: form.primaryColor || "#000000" }}>
                <h3 className="font-bold text-base uppercase">サンプル商品カード</h3>
                <p className="text-xs opacity-80">テーマ設定によってカードやテキストのスタイルが変化します。</p>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-black" style={{ color: form.accentColor || "#0000FF" }}>
                    ¥1,200
                  </span>
                  <button
                    className="h-9 px-4 text-xs font-bold uppercase transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: form.primaryColor || "#000000",
                      color: form.primaryTextColor || "#FFFFFF",
                    }}
                  >
                    注文に追加
                  </button>
                </div>
              </div>

              {/* アクセントカラーボタンバッジ */}
              <div
                className="p-4 text-center space-y-2"
                style={{
                  backgroundColor: form.accentColor || "#0000FF",
                  color: form.accentTextColor || "#FFFFFF",
                }}
              >
                <span className="text-xs font-black uppercase tracking-widest">HIGHLIGHT BADGE</span>
                <p className="text-sm font-bold">アクセントカラーの強調表示領域です</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
