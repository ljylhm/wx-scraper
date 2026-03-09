"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminShell } from "@/components/admin/AdminShell";

type AutoLoginConfig = {
  enabled: boolean;
  hour: number;
  minute: number;
  channels: Array<"135" | "96">;
  updatedAt: number;
  lastRunAt?: number;
};

type AutoLoginHistoryItem = {
  id: number;
  trigger: "manual" | "scheduled";
  startedAt: number;
  finishedAt: number;
  success: boolean;
  results: Array<{
    channel: "135" | "96";
    success: boolean;
    message: string;
  }>;
};

type AutoLoginCookieItem = {
  channel: "135" | "96";
  cookieCount: number;
  timestamp: number;
  cookiePreview: string;
};

export default function AutoLoginAdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [loginLoading, setLoginLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingCookies, setLoadingCookies] = useState(false);

  const [config, setConfig] = useState<AutoLoginConfig>({
    enabled: false,
    hour: 9,
    minute: 0,
    channels: ["135", "96"],
    updatedAt: 0,
  });

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyItems, setHistoryItems] = useState<AutoLoginHistoryItem[]>([]);
  const [cookies, setCookies] = useState<AutoLoginCookieItem[]>([]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(historyTotal / historyPageSize));
  }, [historyTotal, historyPageSize]);

  const loadConfig = useCallback(async () => {
    const response = await fetch("/api/auto-login/config", {
      method: "GET",
      credentials: "include",
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || "加载配置失败");
    }
    setConfig(result.data);
  }, []);

  const loadHistory = useCallback(async (page: number) => {
    setLoadingHistory(true);
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(historyPageSize) });
      const response = await fetch(`/api/auto-login/history?${query.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "加载历史失败");
      }

      setHistoryPage(page);
      setHistoryItems(result.data.items || []);
      setHistoryTotal(result.data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载历史失败");
    } finally {
      setLoadingHistory(false);
    }
  }, [historyPageSize]);

  const loadCookies = useCallback(async () => {
    setLoadingCookies(true);
    try {
      const response = await fetch("/api/auto-login/cookies", {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "加载Cookie失败");
      }
      setCookies(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载Cookie失败");
    } finally {
      setLoadingCookies(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    await Promise.all([loadConfig(), loadHistory(1), loadCookies()]);
  }, [loadConfig, loadHistory, loadCookies]);

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
    loadAll();
  }, [authed, loadAll]);

  useEffect(() => {
    if (!authed) {
      return;
    }
    loadHistory(1);
  }, [historyPageSize, authed, loadHistory]);

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("请输入管理员密码");
      return;
    }

    setLoginLoading(true);
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
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAuthed(false);
    setHistoryItems([]);
    setCookies([]);
  };

  const handleSaveConfig = async () => {
    setSaveLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auto-login/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "保存失败");
      }

      setConfig(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRunNow = async () => {
    setRunLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auto-login/run", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "执行失败");
      }

      await Promise.all([loadConfig(), loadHistory(1), loadCookies()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行失败");
    } finally {
      setRunLoading(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-gray-600">正在校验管理员身份...</div>;
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
          <Button className="w-full" onClick={handleLogin} disabled={loginLoading}>
            {loginLoading ? "登录中..." : "登录"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <AdminShell
      title="定时登录管理"
      subtitle="配置每日登录刷新并追踪执行结果"
      onLogout={handleLogout}
      actions={<Button variant="outline" onClick={loadAll}>刷新</Button>}
    >
      <div className="max-w-7xl mx-auto space-y-4">

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card className="p-4 space-y-3">
          <h2 className="text-base font-semibold">定时配置</h2>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              启用定时登录
            </label>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">每天</span>
              <Input
                className="w-20"
                type="number"
                min={0}
                max={23}
                value={config.hour}
                onChange={(e) => setConfig((prev) => ({ ...prev, hour: Number(e.target.value || 0) }))}
              />
              <span className="text-sm text-gray-700">:</span>
              <Input
                className="w-20"
                type="number"
                min={0}
                max={59}
                value={config.minute}
                onChange={(e) => setConfig((prev) => ({ ...prev, minute: Number(e.target.value || 0) }))}
              />
              <span className="text-sm text-gray-500">(24小时制)</span>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.channels.includes("135")}
                onChange={(e) => {
                  setConfig((prev) => ({
                    ...prev,
                    channels: e.target.checked
                      ? Array.from(new Set([...prev.channels, "135"])) as Array<"135" | "96">
                      : prev.channels.filter((c) => c !== "135"),
                  }));
                }}
              />
              135
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.channels.includes("96")}
                onChange={(e) => {
                  setConfig((prev) => ({
                    ...prev,
                    channels: e.target.checked
                      ? Array.from(new Set([...prev.channels, "96"])) as Array<"135" | "96">
                      : prev.channels.filter((c) => c !== "96"),
                  }));
                }}
              />
              96
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSaveConfig} disabled={saveLoading}>
              {saveLoading ? "保存中..." : "保存配置"}
            </Button>
            <Button variant="outline" onClick={handleRunNow} disabled={runLoading}>
              {runLoading ? "执行中..." : "立即执行一次"}
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            最近执行时间：{config.lastRunAt ? new Date(config.lastRunAt).toLocaleString() : "暂无"}
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">当前Cookie</h2>
            <Button variant="outline" onClick={loadCookies} disabled={loadingCookies}>刷新Cookie</Button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="p-3">渠道</th>
                <th className="p-3">Cookie条数</th>
                <th className="p-3">更新时间</th>
                <th className="p-3">预览</th>
              </tr>
            </thead>
            <tbody>
              {cookies.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={4}>暂无Cookie</td>
                </tr>
              ) : (
                cookies.map((item) => (
                  <tr key={item.channel} className="border-b last:border-b-0">
                    <td className="p-3">{item.channel}</td>
                    <td className="p-3">{item.cookieCount}</td>
                    <td className="p-3">{item.timestamp ? new Date(item.timestamp).toLocaleString() : "-"}</td>
                    <td className="p-3 font-mono text-xs">{item.cookiePreview || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">执行历史</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">每页</label>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs"
                value={historyPageSize}
                onChange={(e) => setHistoryPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="p-3">时间</th>
                <th className="p-3">触发方式</th>
                <th className="p-3">结果</th>
                <th className="p-3">详情</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.length === 0 ? (
                <tr>
                  <td className="p-4 text-center text-gray-500" colSpan={4}>暂无历史</td>
                </tr>
              ) : (
                historyItems.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="p-3">{new Date(item.startedAt).toLocaleString()}</td>
                    <td className="p-3">{item.trigger === "manual" ? "手动" : "定时"}</td>
                    <td className="p-3">{item.success ? "成功" : "失败"}</td>
                    <td className="p-3 text-xs">
                      {item.results.map((r) => `${r.channel}:${r.success ? "ok" : "fail"}(${r.message})`).join(" | ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">共 {historyTotal} 条，当前第 {historyPage}/{totalPages} 页</div>
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={historyPage <= 1 || loadingHistory}
                onClick={() => loadHistory(historyPage - 1)}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                disabled={historyPage >= totalPages || loadingHistory}
                onClick={() => loadHistory(historyPage + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
