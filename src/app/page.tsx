import Link from "next/link";

const quickEntrances = [
  { title: "模板提取", href: "/edit", desc: "输入模板编号并转发到目标编辑器" },
  { title: "管理后台", href: "/admin", desc: "管理员入口（访问码/记录/定时登录）" },
  { title: "网页爬虫", href: "/scraper", desc: "调试抓取规则与内容选择器" },
  { title: "登录调试", href: "/login-test", desc: "检查登录链路和Cookie写入" },
  { title: "保存调试", href: "/save-test", desc: "验证保存流程与接口结果" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,#dbeafe,transparent_35%),radial-gradient(circle_at_95%_15%,#ffedd5,transparent_35%),linear-gradient(165deg,#f8fafc,#eef2ff_55%,#f8fafc)]">
      <main className="max-w-6xl mx-auto px-6 py-10 md:py-14">
        <section className="rounded-3xl bg-white/80 backdrop-blur border border-white shadow-xl p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-700 font-semibold">WX Scraper Console</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            模板提取与分发管理平台
          </h1>
          <p className="mt-4 text-slate-600 text-base md:text-lg max-w-3xl leading-8">
            一个统一入口，支持模板提取、跨编辑器分发、访问码管理、提取记录追踪和自动登录维护。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/edit"
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              进入模板提取
            </Link>
            <Link
              href="/admin"
              className="px-5 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              进入管理后台
            </Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {quickEntrances.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <article className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all h-full">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{item.title}</h2>
                <p className="text-sm text-slate-600 mt-2 leading-6">{item.desc}</p>
                <p className="mt-4 text-sm font-medium text-blue-600">打开 →</p>
              </article>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
