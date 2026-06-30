"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleAuthGuard } from "@/hooks/useCircleAuth";
import { circleApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, ArrowLeft, ToggleLeft, ToggleRight, Sparkles, Plus, Trash2, Globe, FileJson, ToggleRight as ToggleOn, ToggleLeft as ToggleOff } from "lucide-react";
import Link from "next/link";

interface SettingsSchemaField {
  key: string;
  label: string;
  type: "string" | "text" | "boolean" | "number";
  default: any;
}

interface ModManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  settingsSchema: SettingsSchemaField[];
  hooks: {
    menuHeader?: string;
    menuBodyBottom?: string;
    registerAction?: string;
    [key: string]: any;
  };
}

interface InstalledModState {
  manifest: ModManifest;
  enabled: boolean;
  settings: Record<string, any>;
}

interface ModsPayload {
  installed: Record<string, InstalledModState>;
}



function ModsSettingsContent() {
  const [circleId, setCircleId] = useState<string>("");
  const queryClient = useQueryClient();

  const [installedMods, setInstalledMods] = useState<Record<string, InstalledModState>>({});
  const [manifestUrl, setManifestUrl] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);
  const [isJsonImportOpen, setIsJsonImportOpen] = useState(false);

  useEffect(() => {
    const storedCircleId = localStorage.getItem("circleId");
    if (storedCircleId) {
      setCircleId(storedCircleId);
    }
  }, []);

  const { data: circle, isLoading } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => circleApi.get(circleId),
    enabled: !!circleId,
  });

  useEffect(() => {
    if (circle && circle.mods) {
      try {
        const parsed = JSON.parse(circle.mods) as ModsPayload;
        if (parsed && parsed.installed) {
          setInstalledMods(parsed.installed);
        } else {
          setInstalledMods({});
        }
      } catch (e) {
        console.error("Failed to parse mods JSON:", e);
        setInstalledMods({});
      }
    }
  }, [circle]);

  const updateModsMutation = useMutation({
    mutationFn: async (mods: ModsPayload) => {
      return await circleApi.updateMods(circleId, mods);
    },
    onSuccess: () => {
      toast.success("拡張機能の設定を保存しました");
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "設定の保存に失敗しました");
    },
  });

  const handleSave = () => {
    updateModsMutation.mutate({ installed: installedMods });
  };

  // モッドのインストール処理
  const installMod = (manifest: ModManifest) => {
    if (!manifest.id || !manifest.name) {
      toast.error("無効なマニフェスト形式です。(idとnameは必須です)");
      return;
    }

    if (installedMods[manifest.id]) {
      toast.info(`モッド「${manifest.name}」は既にインストールされています。`);
      return;
    }

    // デフォルトの設定値を構築
    const defaultSettings: Record<string, any> = {};
    if (manifest.settingsSchema) {
      manifest.settingsSchema.forEach((field) => {
        defaultSettings[field.key] = field.default;
      });
    }

    const updated = {
      ...installedMods,
      [manifest.id]: {
        manifest,
        enabled: false,
        settings: defaultSettings,
      },
    };

    setInstalledMods(updated);
    toast.success(`モッド「${manifest.name}」をインストールしました。有効化して設定を行ってください。`);
  };

  // URLからインポート
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifestUrl.trim()) return;

    try {
      const res = await fetch(manifestUrl.trim());
      if (!res.ok) throw new Error("マニフェストの取得に失敗しました");
      const manifest = (await res.json()) as ModManifest;
      installMod(manifest);
      setManifestUrl("");
      setIsUrlImportOpen(false);
    } catch (err: any) {
      toast.error(err.message || "インポート中にエラーが発生しました");
    }
  };

  // JSON貼り付けからインポート
  const handleJsonImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;

    try {
      const manifest = JSON.parse(jsonInput.trim()) as ModManifest;
      installMod(manifest);
      setJsonInput("");
      setIsJsonImportOpen(false);
    } catch (err: any) {
      toast.error("JSONのパースに失敗しました。正しいJSON形式であることを確認してください。");
    }
  };

  // アンインストール
  const uninstallMod = (id: string, name: string) => {
    if (confirm(`拡張機能「${name}」をアンインストールしますか？ 設定データも削除されます。`)) {
      const updated = { ...installedMods };
      delete updated[id];
      setInstalledMods(updated);
      toast.success("アンインストールしました。設定を保存すると反映されます。");
    }
  };

  // 設定値の更新
  const updateSettingValue = (modId: string, key: string, value: any) => {
    setInstalledMods((prev) => {
      const mod = prev[modId];
      if (!mod) return prev;
      return {
        ...prev,
        [modId]: {
          ...mod,
          settings: {
            ...mod.settings,
            [key]: value,
          },
        },
      };
    });
  };

  // 有効・無効トグル
  const toggleMod = (modId: string) => {
    setInstalledMods((prev) => {
      const mod = prev[modId];
      if (!mod) return prev;
      return {
        ...prev,
        [modId]: {
          ...mod,
          enabled: !mod.enabled,
        },
      };
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-sp-4 space-y-sp-4 font-mono">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-sp-4 space-y-sp-5">
      {/* 戻るリンク */}
      <Link
        href="/dashboard"
        className="font-mono text-[13px] uppercase tracking-[1px] underline hover:text-[#0000FF] flex items-center gap-1"
      >
        <ArrowLeft className="h-4 w-4" /> ダッシュボードに戻る
      </Link>

      <div className="border-b-[3px] border-black pb-sp-3 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-[48px] font-headline uppercase tracking-tight leading-[1.0]">
            拡張機能 (モッド)
          </h1>
          <p className="font-mono text-[14px] uppercase tracking-[1px] mt-sp-1">
            外部リポジトリなどから配布されたモッドをインポートし、独自に拡張できます
          </p>
        </div>
      </div>

      {/* インポートセクション */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Button
          onClick={() => {
            setIsUrlImportOpen(!isUrlImportOpen);
            setIsJsonImportOpen(false);
          }}
          variant="outline"
          className="h-14 border-[3px] border-black font-mono font-bold rounded-none uppercase flex items-center justify-center gap-2"
        >
          <Globe className="h-5 w-5" />
          URLからモッドを導入
        </Button>
        <Button
          onClick={() => {
            setIsJsonImportOpen(!isJsonImportOpen);
            setIsUrlImportOpen(false);
          }}
          variant="outline"
          className="h-14 border-[3px] border-black font-mono font-bold rounded-none uppercase flex items-center justify-center gap-2"
        >
          <FileJson className="h-5 w-5" />
          マニフェストJSONを入力
        </Button>
      </div>

      {/* URLインポートパネル */}
      {isUrlImportOpen && (
        <Card className="border-[3px] border-black rounded-none p-4 bg-[#F0F0F0] space-y-3">
          <form onSubmit={handleUrlImport} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="manifestUrl" className="sr-only">マニフェストURL</Label>
              <Input
                id="manifestUrl"
                type="url"
                placeholder="https://example.com/mod/manifest.json"
                className="h-12 border-[2px] border-black bg-white rounded-none font-mono text-sm"
                value={manifestUrl}
                onChange={(e) => setManifestUrl(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="h-12 border-[2px] border-black bg-black text-white rounded-none font-mono hover:bg-white hover:text-black font-bold uppercase shrink-0"
            >
              <Plus className="mr-1 h-5 w-5" />
              取得してインストール
            </Button>
          </form>
          <p className="text-xs font-mono text-gray-600">
            ※モッドのリポジトリで公開されている Raw 状態の `manifest.json` のURLを入力してください。
          </p>
        </Card>
      )}

      {/* JSONインポートパネル */}
      {isJsonImportOpen && (
        <Card className="border-[3px] border-black rounded-none p-4 bg-[#F0F0F0] space-y-3">
          <form onSubmit={handleJsonImport} className="space-y-3">
            <Label htmlFor="jsonArea" className="font-mono text-xs font-bold">[マニフェストJSONデータ貼り付け]</Label>
            <textarea
              id="jsonArea"
              placeholder='{\n  "id": "my-custom-mod",\n  "name": "カスタムスタンプ機能",\n  "version": "1.0.0",\n  "settingsSchema": [],\n  "hooks": {}\n}'
              className="flex min-h-[160px] w-full bg-white text-foreground border-black border-[2px] px-[12px] py-[10px] font-mono text-xs transition-all outline-none rounded-none"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              required
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-12 border-[2px] border-black bg-black text-white rounded-none font-mono hover:bg-white hover:text-black font-bold uppercase"
              >
                <Plus className="mr-1 h-5 w-5" />
                パースしてインストール
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* インストール済みモッド一覧・設定 */}
      <div className="space-y-6">
        <h2 className="text-2xl font-mono font-black uppercase border-b-[2px] border-black pb-2 flex items-center gap-2">
          <span>[インストール済みの拡張機能]</span>
          <span className="text-sm font-normal text-gray-500">({Object.keys(installedMods).length}個)</span>
        </h2>

        {Object.keys(installedMods).length === 0 ? (
          <div className="border-[3px] border-dashed border-black p-12 text-center bg-[#F0F0F0]">
            <p className="font-mono text-gray-500">インストールされた拡張機能はありません。</p>
            <p className="font-mono text-xs text-gray-400 mt-2">
              上のボタンから、コミュニティ等で配布されているマニフェストのURLまたはJSONを入力して導入してください。
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(installedMods).map(([modId, modState]) => {
              const { manifest, enabled, settings } = modState;
              return (
                <Card key={modId} className="border-[4px] border-black rounded-none shadow-none">
                  <CardHeader className="border-b-[3px] border-black bg-accent text-accent-foreground p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-2xl font-mono flex items-center gap-2">
                          <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                          {manifest.name}
                        </CardTitle>
                        <CardDescription className="text-sm font-mono mt-2 text-black/85">
                          {manifest.description}
                          {manifest.author && <span className="block mt-1 text-xs text-gray-700">開発者: {manifest.author} | v{manifest.version}</span>}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto shrink-0">
                        <Button
                          type="button"
                          variant={enabled ? "default" : "outline"}
                          onClick={() => toggleMod(modId)}
                          className="border-[3px] border-black font-mono font-bold rounded-none h-12 uppercase flex-1 sm:flex-none"
                        >
                          {enabled ? (
                            <>
                              <ToggleOn className="mr-2 h-6 w-6 text-green-500" /> 有効
                            </>
                          ) : (
                            <>
                              <ToggleOff className="mr-2 h-6 w-6 text-gray-400" /> 無効
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => uninstallMod(modId, manifest.name)}
                          className="border-[3px] border-black bg-white text-black hover:bg-red-500 hover:text-white rounded-none h-12 p-3 shrink-0"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* 動的設定項目レンダリング */}
                  {enabled && manifest.settingsSchema && manifest.settingsSchema.length > 0 && (
                    <CardContent className="p-6 space-y-4">
                      <p className="font-mono text-xs font-bold uppercase mb-2 border-b border-black pb-1">[設定項目]</p>
                      {manifest.settingsSchema.map((field) => {
                        const currentValue = settings[field.key] ?? field.default;
                        return (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={`${modId}-${field.key}`} className="font-mono font-bold text-sm">
                              {field.label}
                            </Label>
                            {field.type === "text" ? (
                              <textarea
                                id={`${modId}-${field.key}`}
                                value={currentValue}
                                onChange={(e) => updateSettingValue(modId, field.key, e.target.value)}
                                className="flex min-h-[96px] w-full bg-[#F0F0F0] text-foreground border-black border-[3px] px-[12px] py-[10px] font-mono text-[15px] transition-all outline-none placeholder:text-muted-foreground hover:brightness-95 focus-visible:border-black focus-visible:border-[5px] focus-visible:ring-0 disabled:pointer-events-none disabled:border-muted disabled:bg-muted rounded-none"
                              />
                            ) : field.type === "boolean" ? (
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  variant={currentValue ? "default" : "outline"}
                                  onClick={() => updateSettingValue(modId, field.key, !currentValue)}
                                  className="border-[2px] border-black font-mono font-bold rounded-none h-10 px-4"
                                >
                                  {currentValue ? "はい (ON)" : "いいえ (OFF)"}
                                </Button>
                              </div>
                            ) : (
                              <Input
                                id={`${modId}-${field.key}`}
                                type={field.type === "number" ? "number" : "text"}
                                value={currentValue}
                                onChange={(e) => updateSettingValue(modId, field.key, field.type === "number" ? Number(e.target.value) : e.target.value)}
                                className="h-12 border-[3px] border-black bg-[#F0F0F0] font-mono rounded-none focus-visible:border-[5px] focus-visible:ring-0"
                              />
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t-[2px] border-black">
          <Button
            onClick={handleSave}
            disabled={updateModsMutation.isPending}
            className="h-14 border-[3px] border-black bg-black font-mono text-lg font-bold text-white rounded-none hover:bg-white hover:text-black uppercase px-8"
          >
            <Save className="mr-2 h-6 w-6" />
            {updateModsMutation.isPending ? "設定を保存中..." : "変更を確定して保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ModsSettingsPage() {
  return (
    <CircleAuthGuard>
      <ModsSettingsContent />
    </CircleAuthGuard>
  );
}
