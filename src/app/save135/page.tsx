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

export default function Save135Page() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingCookie, setTestingCookie] = useState(false);
  const [cookieStatus, setCookieStatus] = useState<{
    valid?: boolean;
    message?: string;
    username?: string;
  } | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  // 测试Cookie有效性
  const testCookie = async () => {
    if (!cookie.trim()) {
      setCookieStatus({
        valid: false,
        message: '请先输入Cookie',
      });
      return;
    }

    setTestingCookie(true);
    setCookieStatus(null);

    try {
      const response = await fetch('/api/save135/test-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cookie }),
      });

      const data = await response.json() as ApiResponse;

      if (response.ok && data.success) {
        setCookieStatus({
          valid: data.valid,
          message: data.message,
          username: data.username,
        });
      } else {
        setCookieStatus({
          valid: false,
          message: data.message || data.error || '测试失败，请重试',
        });
      }
    } catch (error) {
      setCookieStatus({
        valid: false,
        message: error instanceof Error ? error.message : '测试失败，请重试',
      });
    } finally {
      setTestingCookie(false);
    }
  };

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

    if (!cookie.trim()) {
      setResult({
        success: false,
        error: '请提供135编辑器的登录Cookie',
        needLogin: true
      });
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      // 调用保存API
      const response = await fetch('/api/save135', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          cookie,
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
          <CardTitle className="text-2xl">保存文章到135编辑器</CardTitle>
          <CardDescription>
            填写标题、内容和登录Cookie，保存到135编辑器
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
              <div className="flex justify-between items-center">
                <label htmlFor="cookie" className="text-sm font-medium flex items-center">
                  <span>登录Cookie</span>
                  <div className="ml-2 relative group">
                    <Info className="h-4 w-4 text-gray-500" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded w-64 z-10">
                      请先登录135编辑器，然后在浏览器开发者工具中复制Cookie。在Chrome中，可以按F12打开开发者工具，选择Network标签，刷新页面，点击任意请求，在Headers中找到Cookie并复制完整内容。
                    </div>
                  </div>
                </label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={testCookie}
                  disabled={testingCookie || !cookie.trim()}
                >
                  {testingCookie ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '测试Cookie'
                  )}
                </Button>
              </div>
              <Textarea
                id="cookie"
                placeholder="请粘贴从135编辑器获取的Cookie"
                value={cookie}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setCookie(e.target.value);
                  setCookieStatus(null); // 清除之前的测试结果
                }}
                required
                className="min-h-[100px] text-xs"
              />
              
              {cookieStatus && (
                <Alert 
                  variant={cookieStatus.valid ? "default" : "destructive"}
                  className={cookieStatus.valid ? "bg-green-50 border-green-200" : ""}
                >
                  {cookieStatus.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>{cookieStatus.valid ? 'Cookie有效' : 'Cookie无效'}</AlertTitle>
                  <AlertDescription>
                    {cookieStatus.message}
                    {cookieStatus.valid && cookieStatus.username && (
                      <div className="mt-1 text-sm">已登录用户: <span className="font-medium">{cookieStatus.username}</span></div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>如何获取Cookie</AlertTitle>
              <AlertDescription className="text-sm">
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>使用Chrome或Edge浏览器，访问并登录 <a href="https://www.135editor.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">135编辑器</a></li>
                  <li>按F12打开开发者工具，切换到Network标签</li>
                  <li>刷新页面，在请求列表中点击任意请求</li>
                  <li>在Headers标签中找到Cookie字段，右键点击值并选择&quot;复制值&quot;</li>
                  <li>将复制的内容粘贴到上方的Cookie输入框中</li>
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
                      请确保您已登录135编辑器并提供了正确的Cookie。如果您的Cookie已过期，请重新登录135编辑器并获取新的Cookie。
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
              disabled={loading || !title.trim() || !content.trim() || !cookie.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存到135编辑器'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 