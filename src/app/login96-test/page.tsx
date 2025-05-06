"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface LoginResult {
  success: boolean;
  cookies?: string[];
  error?: string;
  message?: string;
  data?: {
    cookies: string;
  };
  isCached?: boolean;
}

export default function Login96TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LoginResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redisInfo, setRedisInfo] = useState<string>("");

  // 获取Redis信息
  useEffect(() => {
    async function getRedisInfo() {
      try {
        const response = await fetch('/api/cookie-path');
        if (response.ok) {
          const data = await response.json();
          setRedisInfo(data.redisInfo || "Upstash Redis");
        }
      } catch (err) {
        console.error("获取Redis信息失败:", err);
      }
    }
    getRedisInfo();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/login96');
      console.log("response", response);
      const data = await response.json() as LoginResult;
      
      setResult(data);
      
      // 显示登录结果信息
      if (!data.success) {
        setError(`登录失败: ${data.error || '未知错误'}`);
      }
    } catch (err) {
      setError('请求失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/login96', {
        method: 'GET'
      });
      const data = await response.json() as LoginResult;
      
      if (data.success) {
        setResult(null);
        setError('Cookie缓存和浏览器实例已清除');
      } else {
        setError('清除缓存失败: ' + data.error);
      }
    } catch (err) {
      setError('请求失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">96微信编辑器登录测试</h1>
      
      <Card className="mb-4 p-4 bg-yellow-50">
        <h2 className="text-lg font-semibold mb-2 text-yellow-700">登录方式说明</h2>
        <p className="text-sm text-gray-600">首次登录可能需要30-60秒，请耐心等待。</p>
      </Card>
      
      {redisInfo && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
          <p><strong>Cookie存储方式:</strong> {redisInfo}</p>
          <p className="text-xs mt-1">Cookie存储在Redis中，跨服务器和实例共享，无需本地文件</p>
        </div>
      )}
      
      <div className="flex space-x-4 mb-4">
        <Button 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '开始自动登录'}
        </Button>
        
        <Button 
          onClick={handleClearCache}
          disabled={loading}
          variant="outline"
        >
          清除Cookie缓存
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">登录结果</h2>
          
          <div className="mb-2">
            <strong>状态：</strong> 
            {result.success ? (
              <span className="text-green-600">
                成功
                {result.isCached && ' (使用缓存)'}
              </span>
            ) : (
              <span className="text-red-600">失败</span>
            )}
          </div>
          
          {result.message && (
            <div className="mb-2">
              <strong>消息：</strong> {result.message}
            </div>
          )}
          
          {result.data?.cookies && (
            <div className="mb-2">
              <strong>Cookies：</strong>
              <div className="mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                <div className="text-xs truncate">
                  {result.data.cookies.length > 100 
                    ? `${result.data.cookies.substring(0, 100)}...` 
                    : result.data.cookies}
                </div>
              </div>
            </div>
          )}
          
          {result.error && (
            <div>
              <strong>错误详情：</strong>
              <pre className="bg-gray-100 p-2 mt-1 rounded overflow-x-auto text-xs h-40">
                {result.error}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  );
} 