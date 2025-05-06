"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface SaveResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
  needLogin?: boolean;
}

export default function Save96TestPage() {
  const [title, setTitle] = useState("测试文章 " + new Date().toLocaleString());
  const [content, setContent] = useState("<p>这是一篇测试文章内容</p><p>来自 save96-test</p>");
  const [toUser, setToUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setResult({
        success: false,
        error: "标题和内容不能为空"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 调用保存API
      const response = await fetch("/api/save96", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          content,
          to_user: toUser
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "保存失败");
      }

      setResult({
        success: true,
        message: "保存成功",
        data: data.data
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      setLoading(false);
    }
  };

  const loginRedirect = () => {
    window.location.href = "/login96-test";
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">96微信编辑器保存测试</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>96文章保存测试</CardTitle>
          <CardDescription>测试文章保存到96微信编辑器功能</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              文章标题
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入文章标题"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              文章内容
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入文章内容，支持HTML"
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="toUser" className="text-sm font-medium">
              保存到用户ID (可选)
            </label>
            <Input
              id="toUser"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
              placeholder="可选，保存到指定用户"
            />
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>提示</AlertTitle>
            <AlertDescription className="text-sm">
              保存前请确保已经登录了96微信编辑器。如果未登录，保存将会失败。
            </AlertDescription>
          </Alert>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? "保存成功" : "保存失败"}</AlertTitle>
              <AlertDescription>
                {result.message || result.error}

                {result.needLogin && (
                  <div className="mt-2">
                    <p className="text-sm">您需要先登录96微信编辑器</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={loginRedirect}
                    >
                      去登录
                    </Button>
                  </div>
                )}

                {result.success && result.data && (
                  <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={loading || !title.trim() || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              "保存到96微信编辑器"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 