"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [{ name: "Mis OTs", href: "/leader", icon: LayoutDashboard }];

export default function LeaderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen w-full flex-col bg-[#111827]">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#1B2031] px-5 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 bg-[#F55B1F] rounded-lg items-center justify-center shrink-0">
            <HardHat size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">MJR Planta</p>
            <p className="text-[9px] text-[#F55B1F] font-bold uppercase tracking-widest leading-tight">Vista Líder</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5">
          <div className="h-5 w-5 rounded-full bg-[#F55B1F] flex items-center justify-center text-[9px] font-bold text-white shrink-0">JL</div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white/90 leading-none">Juan (Líder)</p>
            <p className="text-[9px] text-white/35 leading-none mt-0.5">Líder de Obra</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20">
        <div className="mx-auto max-w-3xl animate-slide-up">{children}</div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-50 flex h-14 items-center justify-around border-t border-white/5 bg-[#1B2031]/90 backdrop-blur-lg">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-20 h-full transition-colors",
                isActive ? "text-[#F55B1F]" : "text-white/35 hover:text-white/60"
              )}
            >
              <Icon size={18} />
              <span className="text-[9px] font-semibold uppercase tracking-wide">{item.name}</span>
            </Link>
          );
        })}
        <button className="flex flex-col items-center justify-center gap-1 w-20 h-full text-white/35 hover:text-white/60 transition-colors">
          <LogOut size={18} />
          <span className="text-[9px] font-semibold uppercase tracking-wide">Salir</span>
        </button>
      </nav>
    </div>
  );
}
