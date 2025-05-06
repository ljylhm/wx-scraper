'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// 定义返回数据类型
interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  needLogin?: boolean;
  data?: Record<string, unknown>;
  valid?: boolean;
  username?: string;
}

// 定义结果状态类型
interface ResultState {
  success?: boolean;
  message?: string;
  error?: string;
  needLogin?: boolean;
  data?: ApiResponse;
}

export default function Save96Page() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [toUser, setToUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!title.trim() || !content.trim()) {
      setResult({
        success: false,
        error: '标题和内容不能为空'
      });
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      // 调用保存API
      const response = await fetch('/api/save96', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          to_user: toUser
        }),
      });
      
      const data = await response.json() as ApiResponse;
      
      if (!response.ok) {
        throw new Error(data.message || data.error || '保存失败');
      }
      
      setResult({
        success: true,
        message: '保存成功',
        data,
      });
      
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">保存文章到96微信编辑器</CardTitle>
          <CardDescription>
            填写标题和内容，保存到96微信编辑器
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                文章标题
              </label>
              <Input
                id="title"
                placeholder="请输入文章标题"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                文章内容
              </label>
              <Textarea
                id="content"
                placeholder="请输入文章内容，支持HTML格式"
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                required
                className="min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="toUser" className="text-sm font-medium">
                保存到用户ID（可选）
              </label>
              <Input
                id="toUser"
                placeholder="保存到指定用户，不填则保存到当前登录账号"
                value={toUser}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToUser(e.target.value)}
              />
            </div>

            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>使用说明</AlertTitle>
              <AlertDescription className="text-sm">
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>使用保存功能前，请确保您已经通过登录接口成功登录96微信编辑器</li>
                  <li>标题和内容为必填项，系统会自动使用您的登录凭证进行保存</li>
                  <li>如需保存到其他用户账号下，请在&quot;保存到用户ID&quot;字段中填写目标用户ID</li>
                </ol>
              </AlertDescription>
            </Alert>
            
            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>{result.success ? '保存成功' : '保存失败'}</AlertTitle>
                <AlertDescription>
                  {result.message || result.error}
                  
                  {result.needLogin && (
                    <div className="mt-2 text-sm">
                      请确保您已登录96微信编辑器。如果您尚未登录或登录已过期，请先访问登录页面进行登录。
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
              type="submit" 
              disabled={loading || !title.trim() || !content.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存到96微信编辑器'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 