"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2, HardHat } from "lucide-react";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace("/admin");
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#111827] gap-8">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-20 w-20 rounded-3xl brand-gradient flex items-center justify-center shadow-2xl shadow-orange-500/20">
          <HardHat size={40} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">MJR Estructuras</h1>
          <p className="text-[10px] text-[#F55B1F] font-bold uppercase tracking-[0.4em] mt-1">Cargando Plataforma</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-white/20 text-xs font-bold uppercase tracking-widest">
        <Loader2 className="animate-spin" size={16} />
        Sincronizando Entorno
      </div>
    </div>
  );
}
