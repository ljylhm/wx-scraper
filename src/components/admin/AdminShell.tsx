"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "控制台" },
  { href: "/admin/access-codes", label: "访问码" },
  { href: "/admin/extract-records", label: "提取记录" },
  { href: "/admin/auto-login", label: "定时登录" },
];

type AdminShellProps = {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminShell({ title, subtitle, onLogout, actions, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,#f8fafc,#eef2ff_60%,#fff7ed)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-white shadow-lg p-4 md:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>
              {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <Button variant="outline" onClick={onLogout}>退出登录</Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                    active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
