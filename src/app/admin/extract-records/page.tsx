"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ExtractRecord = {
  id: number;
  extractionId: string;
  createdAt: number;
  updatedAt: number;
  ip: string;
  accessCode: string;
  editorType: string;
  templateCode: string;
  receiverEditorType: string;
  receiverId: string;
  status: "processing" | "success" | "failed";
  resultTemplateId?: string;
  errorMessage?: string;
};

type RecordListResponse = {
  items: ExtractRecord[];
  page: number;
  pageSize: number;
  total: number;
};

export default function ExtractRecordsAdminPage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [accessCode, setAccessCode] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [status, setStatus] = useState("");
  const [ip, setIp] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<RecordListResponse>({ items: [], page: 1, pageSize: 10, total: 0 });

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data.total, data.pageSize]);

  const loadRecords = useCallback(async (targetPage: number = 1) => {
    const currentPage = targetPage;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      query.set("page", String(currentPage));
      query.set("pageSize", String(pageSize));

      if (accessCode.trim()) query.set("accessCode", accessCode.trim());
      if (templateCode.trim()) query.set("templateCode", templateCode.trim());
      if (receiverId.trim()) query.set("receiverId", receiverId.trim());
      if (status.trim()) query.set("status", status.trim());
      if (ip.trim()) query.set("ip", ip.trim());
      if (dateFrom) query.set("dateFrom", dateFrom);
      if (dateTo) query.set("dateTo", dateTo);

      const response = await fetch(`/api/extract-records/list?${query.toString()}`, {
        method: "GET",
        credentials: "include",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "加载提取记录失败");
      }

      setPage(currentPage);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载提取记录失败");
    } finally {
      setLoading(false);
    }
  }, [accessCode, templateCode, receiverId, status, ip, dateFrom, dateTo, pageSize]);

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

    loadRecords(1);
  }, [authed, pageSize, loadRecords]);

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
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    setAuthed(false);
    setData({ items: [], page: 1, pageSize, total: 0 });
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
          <Button className="w-full" onClick={handleLogin} disabled={loginLoading}>
            {loginLoading ? "登录中..." : "登录"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">模板提取记录</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => loadRecords(1)} disabled={loading}>刷新</Button>
            <Button variant="outline" onClick={handleLogout}>退出登录</Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card className="p-4 space-y-3">
          <h2 className="text-base font-semibold">条件搜索</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="提取码" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} />
            <Input placeholder="模板编号" value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} />
            <Input placeholder="接收账号" value={receiverId} onChange={(e) => setReceiverId(e.target.value)} />
            <Input placeholder="IP" value={ip} onChange={(e) => setIp(e.target.value)} />
            <select
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="processing">处理中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">每页</label>
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => loadRecords(1)} disabled={loading}>{loading ? "查询中..." : "查询"}</Button>
            <Button
              variant="outline"
              onClick={() => {
                setAccessCode("");
                setTemplateCode("");
                setReceiverId("");
                setStatus("");
                setIp("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              重置
            </Button>
          </div>
        </Card>

        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="p-3">时间</th>
                <th className="p-3">IP</th>
                <th className="p-3">提取码</th>
                <th className="p-3">模板编号</th>
                <th className="p-3">接收账号</th>
                <th className="p-3">状态</th>
                <th className="p-3">结果模板ID</th>
                <th className="p-3">错误信息</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={8}>
                    暂无记录
                  </td>
                </tr>
              ) : (
                data.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-b-0">
                    <td className="p-3">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="p-3">{item.ip}</td>
                    <td className="p-3 font-mono">{item.accessCode}</td>
                    <td className="p-3">{item.templateCode}</td>
                    <td className="p-3">{item.receiverEditorType}:{item.receiverId}</td>
                    <td className="p-3">{item.status}</td>
                    <td className="p-3">{item.resultTemplateId || "-"}</td>
                    <td className="p-3 max-w-xs truncate" title={item.errorMessage || ""}>{item.errorMessage || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">共 {data.total} 条，当前第 {page}/{totalPages} 页</div>
          <div className="space-x-2">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => loadRecords(page - 1)}>
              上一页
            </Button>
            <Button variant="outline" disabled={page >= totalPages || loading} onClick={() => loadRecords(page + 1)}>
              下一页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
