"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UsageLog {
  id: number;
  secret_id: number;
  platform_type: string;
  content: string;
  target_account: string;
  used_time: string;
  secret_key?: {
    id: number;
    secret_content: string;
    is_active: boolean;
  }
}

interface StatItem {
  platform_type: string;
  count: number;
  secrets_used: number;
  accounts_reached: number;
}

export default function UsageLogsPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // 创建日志的表单数据
  const [secretId, setSecretId] = useState<string>('');
  const [platformType, setPlatformType] = useState<string>('135editor');
  const [content, setContent] = useState<string>('');
  const [targetAccount, setTargetAccount] = useState<string>('');

  // 获取所有使用日志
  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/usage-logs');
      const result = await response.json();
      
      if (result.code === 0) {
        setLogs(result.data);
      } else {
        setError(result.message || '获取使用日志失败');
      }
    } catch (err) {
      setError('获取使用日志时发生错误');
      console.error('获取使用日志错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取使用统计数据
  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/usage-logs/stats');
      const result = await response.json();
      
      if (result.code === 0) {
        setStats(result.data);
      } else {
        setError(result.message || '获取统计数据失败');
      }
    } catch (err) {
      setError('获取统计数据时发生错误');
      console.error('获取统计数据错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 创建使用记录
  const createUsageLog = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // 表单验证
    if (!secretId || !platformType || !content || !targetAccount) {
      setError('所有字段都是必填的');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/usage-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          secretId: Number(secretId),
          platformType,
          content,
          targetAccount
        }),
      });
      const result = await response.json();
      
      if (result.code === 0) {
        setSuccess('创建使用记录成功');
        // 重置表单
        setContent('');
        setTargetAccount('');
        // 刷新数据
        fetchLogs();
        fetchStats();
      } else {
        setError(result.message || '创建使用记录失败');
      }
    } catch (err) {
      setError('创建使用记录时发生错误');
      console.error('创建使用记录错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">密钥使用记录</h1>
      
      <Tabs defaultValue="logs" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">使用日志</TabsTrigger>
          <TabsTrigger value="stats">使用统计</TabsTrigger>
          <TabsTrigger value="create">创建记录</TabsTrigger>
        </TabsList>
        
        {/* 使用日志标签页 */}
        <TabsContent value="logs" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={fetchLogs} 
              variant="outline"
              disabled={loading}
            >
              刷新日志
            </Button>
          </div>
          
          {/* 日志列表 */}
          <div className="grid grid-cols-1 gap-4">
            {logs.map((log) => (
              <Card key={log.id} className="p-4 shadow-md">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">平台类型</p>
                    <p className="font-medium">{log.platform_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">目标账户</p>
                    <p>{log.target_account}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">使用时间</p>
                    <p>{formatDate(log.used_time)}</p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-500">内容</p>
                  <p className="p-2 bg-gray-50 rounded-md">{log.content}</p>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500">关联密钥</p>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${log.secret_key?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>#{log.secret_id}</span>
                    {log.secret_key && (
                      <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {log.secret_key.secret_content.substring(0, 20)}...
                      </code>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            
            {!loading && logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无使用记录
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* 统计数据标签页 */}
        <TabsContent value="stats" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={fetchStats} 
              variant="outline"
              disabled={loading}
            >
              刷新统计
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用次数</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">密钥数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">账户数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.platform_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.secrets_used}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.accounts_reached}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!loading && stats.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无统计数据
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* 创建记录标签页 */}
        <TabsContent value="create" className="mt-4">
          {/* 状态显示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          
          <form onSubmit={createUsageLog} className="space-y-4">
            <div>
              <Label htmlFor="secretId">密钥ID</Label>
              <Input
                id="secretId"
                type="number"
                value={secretId}
                onChange={(e) => setSecretId(e.target.value)}
                placeholder="输入密钥ID"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="platformType">平台类型</Label>
              <div className="flex space-x-4 mt-1">
                {['135editor', 'wechat', 'other'].map((type) => (
                  <div key={type} className="flex items-center">
                    <input
                      type="radio"
                      id={`platform-${type}`}
                      name="platformType"
                      value={type}
                      checked={platformType === type}
                      onChange={() => setPlatformType(type)}
                      className="mr-2"
                    />
                    <Label htmlFor={`platform-${type}`} className="cursor-pointer">
                      {type === '135editor' ? '135编辑器' : type === 'wechat' ? '微信' : '其他'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">内容</Label>
              <Input
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入内容"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="targetAccount">目标账户</Label>
              <Input
                id="targetAccount"
                value={targetAccount}
                onChange={(e) => setTargetAccount(e.target.value)}
                placeholder="输入目标账户"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? '提交中...' : '创建使用记录'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
      
      {/* 加载指示器 */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-2">处理中...</p>
          </div>
        </div>
      )}
    </div>
  );
} 