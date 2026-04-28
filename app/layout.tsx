import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Home, Shield, UploadCloud } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: '谁是垃圾',
  description: '运动截图打卡排行榜'
};

const nav = [
  { href: '/', label: '榜单', icon: Home },
  { href: '/upload', label: '上传', icon: UploadCloud },
  { href: '/profile/u_demo_tyson', label: '个人', icon: BarChart3 },
  { href: '/admin', label: '核对', icon: Shield }
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen overflow-hidden bg-[#05070d]">
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(255,60,0,0.26),transparent_30%),radial-gradient(circle_at_86%_12%,rgba(10,132,255,0.22),transparent_28%),radial-gradient(circle_at_50%_95%,rgba(191,90,242,0.16),transparent_36%),linear-gradient(180deg,#05070d_0%,#100708_45%,#070914_100%)]" />
          <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:56px_56px] opacity-40" />
          <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
            <header className="mb-5 flex items-center justify-between rounded-[28px] border border-white/10 bg-white/8 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-2xl">
              <Link href="/" className="flex items-center gap-3">
                <div
                  className="h-11 w-11 overflow-hidden rounded-2xl border border-white/15 bg-cover bg-center shadow-lg shadow-black/30 ring-1 ring-white/10"
                  style={{ backgroundImage: "url('/hero-bg.jpg')" }}
                  aria-hidden="true"
                />
                <div>
                  <h1 className="text-xl font-black tracking-wide sm:text-2xl">谁是垃圾</h1>
                  <p className="text-xs font-black tracking-[0.18em] text-amber-200/80">WHO IS RUBBISH!!!</p>
                </div>
              </Link>
              <nav className="flex rounded-[18px] bg-white/8 p-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="flex items-center gap-2 rounded-[18px] px-3 py-2 text-sm font-bold text-white/60 transition hover:bg-white/10 hover:text-white">
                      <Icon size={17} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </header>
            <main className="pb-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
