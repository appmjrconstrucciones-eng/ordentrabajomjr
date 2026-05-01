"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Navbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/5 bg-[#111827]/80 backdrop-blur-md px-6 z-20">
      <div className="flex flex-1 items-center gap-3 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/25" />
          <Input
            type="search"
            placeholder="Buscar proyectos, órdenes de trabajo..."
            className="w-full bg-white/5 border-white/8 pl-9 h-9 text-sm text-white/80 placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-[#F55B1F] focus-visible:border-[#F55B1F]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-all">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F55B1F]" />
        </button>

        <div className="h-6 w-px bg-white/8" />

        {/* User chip */}
        <div className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white/10 transition-all">
          <div className="h-5 w-5 rounded-full brand-gradient flex items-center justify-center text-[9px] font-bold text-white shrink-0">
            CA
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white/90 leading-none">Carlos Admin</p>
            <p className="text-[9px] text-white/35 leading-none mt-0.5">Planta Central</p>
          </div>
        </div>
      </div>
    </header>
  );
}
