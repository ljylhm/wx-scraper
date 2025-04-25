"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SaveResult {
  success?: boolean;
  message?: string;
  error?: string;
  needLogin?: boolean;
  data?: Record<string, unknown>;
}

export default function SaveTestPage() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("测试文章");
  const [content, setContent] = useState("<p>这是一篇测试文章的内容</p>");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("请输入文章标题");
      return;
    }

    if (!content.trim()) {
      setError("请输入文章内容");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/save135', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });
      
      const data = await response.json() as SaveResult;
      
      if (response.ok) {
        setResult(data);
      } else {
        if (data.needLogin) {
          setError(`需要登录: ${data.message || data.error}`);
        } else {
          setError(`保存失败: ${data.message || data.error || "未知错误"}`);
        }
      }
    } catch (err) {
      setError('请求失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // 导航到登录页面
  const goToLogin = () => {
    window.location.href = '/login-test';
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">保存文章到135编辑器</h1>
      
      <Card className="mb-4 p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">文章标题</Label>
            <Input 
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请输入文章标题"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="content">文章内容 (HTML)</Label>
            <Textarea 
              id="content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="请输入HTML格式的文章内容"
              className="mt-1 min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? '保存中...' : '保存文章'}
            </Button>
            
            <Button 
              onClick={goToLogin}
              variant="outline"
            >
              获取登录Cookie
            </Button>
          </div>
        </div>
      </Card>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {result && result.success && (
        <Card className="p-4 bg-green-50">
          <h2 className="text-lg font-semibold mb-2 text-green-700">保存成功</h2>
          <p>{result.message}</p>
          {result.data && (
            <pre className="bg-white p-2 mt-2 rounded overflow-x-auto text-xs border">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </Card>
      )}
    </div>
  );
} 