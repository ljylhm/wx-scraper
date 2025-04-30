"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SecretKey {
  id: number;
  secret_content: string;
  created_time: string;
  is_active: boolean;
  use_count: number;
}

interface UsageLog {
  id: number;
  secret_id: number;
  platform_type: string;
  content: string;
  target_account: string;
  used_time: string;
}

interface PlatformStat {
  platform_type: string;
  count: number;
  accounts_reached: number;
}

interface StatusData {
  secretKey: SecretKey;
  usage: {
    total: number;
    latest: UsageLog | null;
    platformStats: PlatformStat[];
    uniqueAccounts: string[];
  };
}

export default function SecretStatusPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从URL获取密钥ID
  const secretId = searchParams.get('id');
  
  // 获取密钥使用状态
  const fetchStatus = async () => {
    if (!secretId) {
      setError('缺少密钥ID参数');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/usage-logs/status?secretId=${secretId}`);
      const result = await response.json();
      
      if (result.code === 0) {
        setData(result.data);
      } else {
        setError(result.message || '获取密钥使用状态失败');
      }
    } catch (err) {
      setError('获取密钥使用状态时发生错误');
      console.error('获取密钥使用状态错误:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    if (secretId) {
      fetchStatus();
    }
  }, [secretId]);
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // 渲染加载状态
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/secret-manager">
            <Button variant="outline">返回密钥管理</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // 渲染没有密钥ID的状态
  if (!secretId) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>请提供密钥ID参数</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/secret-manager">
            <Button variant="outline">返回密钥管理</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // 渲染无数据状态
  if (!data) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTitle>提示</AlertTitle>
          <AlertDescription>没有找到密钥数据</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/secret-manager">
            <Button variant="outline">返回密钥管理</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">密钥使用状态</h1>
        <div className="flex space-x-4">
          <Button 
            onClick={fetchStatus} 
            variant="outline"
            disabled={loading}
          >
            刷新
          </Button>
          <Link href="/secret-manager">
            <Button variant="outline">返回密钥管理</Button>
          </Link>
        </div>
      </div>
      
      {/* 密钥信息卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${data.secretKey.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
            密钥 #{data.secretKey.id}
            <span className={`ml-2 text-xs px-2 py-1 rounded ${data.secretKey.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {data.secretKey.is_active ? '活跃' : '禁用'}
            </span>
          </CardTitle>
          <CardDescription>创建于 {formatDate(data.secretKey.created_time)}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-1">密钥内容</p>
            <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono block break-all">
              {data.secretKey.secret_content}
            </code>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">总使用次数</p>
              <p className="text-2xl font-bold">{data.secretKey.use_count}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">访问账户数</p>
              <p className="text-2xl font-bold">{data.usage.uniqueAccounts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 使用数据标签页 */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="stats">使用统计</TabsTrigger>
          <TabsTrigger value="accounts">账户列表</TabsTrigger>
          <TabsTrigger value="latest">最近使用</TabsTrigger>
        </TabsList>
        
        {/* 使用统计标签页 */}
        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>平台使用统计</CardTitle>
              <CardDescription>按平台类型统计使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              {data.usage.platformStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台类型</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用次数</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户数量</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">占比</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.usage.platformStats.map((stat, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">{stat.platform_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{stat.count}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{stat.accounts_reached}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {data.usage.total > 0 ? Math.round((stat.count / data.usage.total) * 100) : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无使用统计数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 账户列表标签页 */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>访问账户列表</CardTitle>
              <CardDescription>使用过此密钥的所有账户</CardDescription>
            </CardHeader>
            <CardContent>
              {data.usage.uniqueAccounts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data.usage.uniqueAccounts.map((account, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-3">
                      <span className="font-medium">{account}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无账户使用记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 最近使用标签页 */}
        <TabsContent value="latest">
          <Card>
            <CardHeader>
              <CardTitle>最近使用记录</CardTitle>
              <CardDescription>最近一次使用的详细信息</CardDescription>
            </CardHeader>
            <CardContent>
              {data.usage.latest ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">使用时间</p>
                    <p>{formatDate(data.usage.latest.used_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">平台类型</p>
                    <p>{data.usage.latest.platform_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">目标账户</p>
                    <p>{data.usage.latest.target_account}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">内容</p>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {data.usage.latest.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  暂无使用记录
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 