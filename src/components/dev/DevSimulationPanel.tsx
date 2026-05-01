"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/lib/firebase";
import { useState } from "react";
import { 
  Users, ShieldAlert, UserCheck, X, ChevronRight, Settings2, RefreshCw 
} from "lucide-react";

export function DevSimulationPanel() {
  const { simulateUser, resetSimulation, isSimulated, user: activeUser } = useAuth();
  const { data: users, loading } = useFirestoreCollection<any>("users", [], db);
  const [isOpen, setIsOpen] = useState(false);

  // Solo mostrar en desarrollo o para administradores (en este caso lo dejamos abierto para el USER)
  // if (process.env.NODE_ENV !== "development") return null;

  const managementUsers = users.filter(u => u.role === "ADMIN" || u.role === "LEADER");

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 rounded-3xl bg-[#1B2031] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Settings2 size={16} className="text-[#F55B1F]" />
               <span className="text-xs font-black uppercase tracking-widest text-white/80">Monitor de Simulación</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2 divide-y divide-white/5">
            {isSimulated && (
              <button 
                onClick={resetSimulation}
                className="w-full p-3 flex items-center justify-between hover:bg-red-500/10 text-red-400 transition-all group rounded-xl mb-2 border border-red-500/20"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Detener Simulación</span>
                </div>
                <span className="text-[9px] font-mono opacity-50">v. real</span>
              </button>
            )}

            {loading ? (
              <div className="p-10 text-center text-white/20 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Sincronizando Usuarios...
              </div>
            ) : managementUsers.length === 0 ? (
              <div className="p-10 text-center text-white/10 text-[10px] italic">
                No hay usuarios con acceso registrados
              </div>
            ) : (
              managementUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => simulateUser(u.role, u.email, u.name, u.id)}
                  className={`w-full p-4 flex items-center justify-between rounded-2xl transition-all hover:bg-white/5 text-left group ${
                    activeUser?.dbId === u.id ? 'bg-[#F55B1F]/10 border border-[#F55B1F]/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-[#F55B1F] transition-colors">{u.name}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-tighter mt-0.5">{u.role}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-white/10 group-hover:text-[#F55B1F] transition-transform group-hover:translate-x-1" />
                </button>
              ))
            )}
          </div>
          
          <div className="p-3 bg-white/[0.01] text-center border-t border-white/5">
            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Modo Desarrollador MJR</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
          isSimulated 
            ? 'brand-gradient text-white animate-pulse shadow-orange-500/40 border-2 border-white/20' 
            : 'bg-[#1B2031] border border-white/10 text-white/40 hover:text-white hover:border-white/20 shadow-black/50'
        }`}
      >
        {isSimulated ? <UserCheck size={26} /> : <Users size={26} />}
      </button>
    </div>
  );
}
