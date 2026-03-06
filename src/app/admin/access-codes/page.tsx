"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AccessCodeItem = {
  code: string;
  maxUses: number;
  remainingUses: number;
  usedCount: number;
  createdAt: number;
  disabled: boolean;
  isPermanent: boolean;
};

export default function AccessCodeAdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [codes, setCodes] = useState<AccessCodeItem[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("2");
  const [newPermanent, setNewPermanent] = useState(false);
  const [creating, setCreating] = useState(false);
  const [operatingCode, setOperatingCode] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/access-code/list", {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "加载列表失败");
      }

      setCodes(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载列表失败");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const response = await fetch("/api/admin/me", {
          method: "GET",
          credentials: "include",
        });
        const result = await response.json();

        if (response.ok && result.authenticated) {
          setAuthed(true);
        }
      } catch {
        setAuthed(false);
      } finally {
        setChecking(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!authed) {
      return;
    }

    loadCodes();
  }, [authed, loadCodes]);

  const statusLabel = useMemo(() => {
    return (item: AccessCodeItem) => {
      if (item.disabled) {
        return "已禁用";
      }
      if (item.isPermanent) {
        return "永久有效";
      }
      if (item.remainingUses <= 0) {
        return "已失效";
      }
      return "可用";
    };
  }, []);

  const handleCreateCode = async () => {
    const maxUses = Number.parseInt(newMaxUses, 10);
    if (!newPermanent && (!Number.isFinite(maxUses) || maxUses <= 0)) {
      setError("可用次数必须是正整数");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/access-code/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code: newCode.trim() || undefined,
          maxUses: newPermanent ? 2 : maxUses,
          isPermanent: newPermanent,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "创建失败");
      }

      setNewCode("");
      setNewMaxUses("2");
      setNewPermanent(false);
      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`确认删除访问码 ${code} 吗？`)) {
      return;
    }

    setOperatingCode(code);
    setError(null);
    try {
      const response = await fetch(`/api/access-code/${encodeURIComponent(code)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "删除失败");
      }

      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setOperatingCode(null);
    }
  };

  const handleTogglePermanent = async (code: string, isPermanent: boolean) => {
    setOperatingCode(code);
    setError(null);

    try {
      const response = await fetch(`/api/access-code/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPermanent: !isPermanent }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "更新失败");
      }

      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败");
    } finally {
      setOperatingCode(null);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("请输入管理员密码");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: password.trim() }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "登录失败");
      }

      setAuthed(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthed(false);
    setCodes([]);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">正在校验管理员身份...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md p-6 space-y-4">
          <h1 className="text-xl font-semibold">管理员登录</h1>
          <Input
            type="password"
            placeholder="输入管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">访问码管理</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={loadCodes} disabled={listLoading}>
              {listLoading ? "刷新中..." : "刷新"}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card className="p-4 space-y-3">
          <h2 className="text-base font-semibold">创建访问码</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="可选：手动输入 code（留空自动生成临时码）"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            />
            <Input
              type="number"
              min={1}
              placeholder="可用次数"
              value={newMaxUses}
              disabled={newPermanent}
              onChange={(e) => setNewMaxUses(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newPermanent}
                onChange={(e) => setNewPermanent(e.target.checked)}
              />
              永久有效
            </label>
            <Button onClick={handleCreateCode} disabled={creating}>
              {creating ? "创建中..." : "创建 code"}
            </Button>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="p-3">Code</th>
                <th className="p-3">已用次数</th>
                <th className="p-3">剩余次数</th>
                <th className="p-3">状态</th>
                <th className="p-3">创建时间</th>
                <th className="p-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={6}>
                    暂无访问码
                  </td>
                </tr>
              ) : (
                codes.map((item) => (
                  <tr key={item.code} className="border-b last:border-b-0">
                    <td className="p-3 font-mono">{item.code}</td>
                    <td className="p-3">
                      {item.isPermanent ? item.usedCount : `${item.usedCount}/${item.maxUses}`}
                    </td>
                    <td className="p-3">{item.isPermanent ? "∞" : item.remainingUses}</td>
                    <td className="p-3">{statusLabel(item)}</td>
                    <td className="p-3">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={operatingCode === item.code}
                          onClick={() => handleTogglePermanent(item.code, item.isPermanent)}
                        >
                          {item.isPermanent ? "取消永久" : "设为永久"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={operatingCode === item.code}
                          onClick={() => handleDelete(item.code)}
                        >
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
