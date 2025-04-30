"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface SecretKey {
  id: number;
  secret_content: string;
  created_time: string;
  is_active: boolean;
  use_count: number;
  _count?: {
    secret_usage_log: number;
  }
}

export default function SecretManagerPage() {
  const [secretKeys, setSecretKeys] = useState<SecretKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 获取所有密钥
  const fetchSecretKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/secret-keys');
      const result = await response.json();
      
      if (result.code === 0) {
        setSecretKeys(result.data);
      } else {
        setError(result.message || '获取密钥失败');
      }
    } catch (err) {
      setError('获取密钥时发生错误');
      console.error('获取密钥错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 创建新密钥
  const createSecretKey = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/secret-keys', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.code === 0) {
        setSuccess('创建密钥成功');
        // 刷新列表
        fetchSecretKeys();
      } else {
        setError(result.message || '创建密钥失败');
      }
    } catch (err) {
      setError('创建密钥时发生错误');
      console.error('创建密钥错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 更新密钥状态
  const updateSecretKeyStatus = async (id: number, isActive: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/secret-keys', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isActive }),
      });
      const result = await response.json();
      
      if (result.code === 0) {
        setSuccess(`${isActive ? '启用' : '禁用'}密钥成功`);
        // 刷新列表
        fetchSecretKeys();
      } else {
        setError(result.message || '更新密钥状态失败');
      }
    } catch (err) {
      setError('更新密钥状态时发生错误');
      console.error('更新密钥状态错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchSecretKeys();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">密钥管理</h1>
        <div className="flex space-x-4">
          <Button 
            onClick={fetchSecretKeys} 
            variant="outline"
            disabled={loading}
          >
            刷新
          </Button>
          <Button 
            onClick={createSecretKey}
            disabled={loading}
          >
            生成新密钥
          </Button>
        </div>
      </div>

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
      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      )}

      {/* 密钥列表 */}
      <div className="grid grid-cols-1 gap-4">
        {secretKeys.map((key) => (
          <Card key={key.id} className="p-4 shadow-md">
            <div className="flex justify-between">
              <div>
                <div className="mb-2 flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${key.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">密钥 #{key.id}</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${key.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {key.is_active ? '活跃' : '禁用'}
                  </span>
                </div>
                <div className="mb-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                    {key.secret_content}
                  </code>
                </div>
                <div className="text-sm text-gray-500">
                  创建时间: {new Date(key.created_time).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  使用次数: {key.use_count} | 关联日志: {key._count?.secret_usage_log || 0}
                </div>
              </div>
              <div>
                <Button 
                  variant={key.is_active ? "destructive" : "default"}
                  size="sm"
                  onClick={() => updateSecretKeyStatus(key.id, !key.is_active)}
                  disabled={loading}
                  className="mb-2"
                >
                  {key.is_active ? '禁用' : '启用'}
                </Button>
                <Link href={`/usage-logs/status?id=${key.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    查看详情
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {!loading && secretKeys.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无密钥，请点击&quot;生成新密钥&quot;按钮创建
          </div>
        )}
      </div>
    </div>
  );
} 