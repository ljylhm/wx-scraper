"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/AdminShell";

const adminModules = [
  {
    title: "访问码管理",
    desc: "创建/删除访问码，设置永久有效，查看使用状态",
    href: "/admin/access-codes",
  },
  {
    title: "提取记录",
    desc: "查看模板提取记录，按状态/IP/提取码筛选并分页",
    href: "/admin/extract-records",
  },
  {
    title: "定时登录",
    desc: "配置每天定时登录刷新Cookie，查看执行历史和当前Cookie",
    href: "/admin/auto-login",
  },
];

export default function AdminHomePage() {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        正在校验管理员身份...
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#dbeafe,transparent_40%),radial-gradient(circle_at_90%_15%,#fef3c7,transparent_35%),#f8fafc] flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-4 shadow-xl border-0">
          <h1 className="text-2xl font-semibold text-slate-900">管理员后台</h1>
          <p className="text-sm text-slate-500">请输入管理员密码进入管理控制台</p>
          <Input
            type="password"
            placeholder="管理员密码"
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
    <AdminShell
      title="管理控制台"
      subtitle="统一管理访问码、提取记录和自动登录"
      onLogout={handleLogout}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {adminModules.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full p-5 border-0 shadow-md hover:shadow-xl transition-shadow bg-white/85 backdrop-blur">
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-6">{item.desc}</p>
                <p className="mt-4 text-sm text-blue-600 font-medium">进入模块 →</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
