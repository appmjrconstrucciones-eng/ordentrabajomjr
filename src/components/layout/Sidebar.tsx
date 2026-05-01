"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  LayoutDashboard, FileText, Users, Settings, HardHat, Package, LogOut, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN", "LEADER"] },
  { name: "Órdenes de Trabajo", href: "/admin/work-orders", icon: FileText, roles: ["ADMIN"] },
  { name: "Insumos", href: "/admin/supplies", icon: Package, roles: ["ADMIN"] },
  { name: "Colaboradores", href: "/admin/collaborators", icon: Users, roles: ["ADMIN"] },
  { name: "Vista Monitor", href: "/monitor", icon: HardHat, roles: ["ADMIN", "LEADER"] },
  { name: "Configuración", href: "/admin/settings", icon: Settings, roles: ["ADMIN", "LEADER"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const filteredItems = NAV_ITEMS.filter(item => 
    !item.roles || (user && item.roles.includes(user.role as string))
  );

  return (
    <aside className="flex h-full w-64 flex-col bg-[#1B2031] border-r border-white/5">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg brand-gradient shadow-lg shadow-orange-500/20 shrink-0">
          <HardHat size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight uppercase tracking-tighter">MJR Estructuras</p>
          <p className="text-[10px] text-[#F55B1F] font-semibold uppercase tracking-[0.2em] leading-tight mt-0.5">
            Taller OT
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-6">
        <p className="text-[9px] font-black uppercase tracking-widest text-white/20 px-4 mb-4">
          Accesos del Sistema
        </p>
        
        {loading ? (
             <div className="px-4 py-2 flex items-center gap-2 text-white/20 text-xs">
                <Loader2 size={14} className="animate-spin" /> Verificando permisos...
             </div>
        ) : (
          filteredItems.map((item) => {
            const isActive = item.href === "/admin" 
              ? pathname === "/admin" 
              : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "nav-active font-bold shadow-lg shadow-orange-500/5"
                    : "text-white/40 hover:bg-white/[0.03] hover:text-white/80"
                )}
              >
                <Icon size={18} className={cn(
                    "transition-colors",
                    isActive ? "text-[#F55B1F]" : "group-hover:text-white/60"
                )} />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/5 px-4 py-4 space-y-2">
        {user && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="h-9 w-9 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-black shrink-0 shadow-lg shadow-orange-500/10">
                {user.displayName?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-none mb-1">
                    {user.displayName || user.email?.split('@')[0]}
                </p>
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                    user.role === 'ADMIN' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                )}>
                    {user.role}
                </span>
              </div>
            </div>
        )}
        
        <button 
           onClick={logout}
           className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all"
        >
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
