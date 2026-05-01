"use client";

import { useEffect, useState } from "react";
import { HardHat, Clock, Activity, Users, ArrowLeft, Loader2, Package } from "lucide-react";
import Link from "next/link";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/lib/firebase";

export default function MonitorPage() {
  const [time, setTime] = useState(new Date());
  const { data: workOrders, loading } = useFirestoreCollection<any>("work_orders", [], db);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Extraer todos los colaboradores que tienen una sesión activa
  const activeWorkers = workOrders.flatMap(ot => 
    (ot.laborSessions || [])
      .filter((s: any) => s.status === "ACTIVE")
      .map((s: any) => ({
        ...s,
        otName: ot.name,
        otId: ot.id,
        project: ot.projectTitle
      }))
  );

  // OTs que tienen al menos un colaborador trabajando
  const activeOTs = workOrders.filter(ot => 
    ot.laborSessions?.some((s: any) => s.status === "ACTIVE")
  );

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = time.getTime();
    const diff = Math.max(0, now - start);
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#111827]">
      {/* Top Bar Monitor */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-[#1B2031]">
        <div className="flex items-center gap-8">
          <Link 
            href="/admin" 
            className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-[#F55B1F] hover:text-white transition-all group shadow-2xl"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl brand-gradient flex items-center justify-center shadow-2xl shadow-orange-500/20">
              <HardHat size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                Monitoreo de Planta
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-[#F55B1F] font-black uppercase tracking-[0.4em] rounded-full bg-[#F55B1F]/5 border border-[#F55B1F]/20 px-4 py-1">
                  MJR · Estructuras Metálicas
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500/30" />
                <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest italic">Live Feed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col items-end">
           <div className="px-5 py-3 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner">
              <p className="text-4xl font-mono font-black text-white leading-none tracking-tighter">
                {time.toLocaleTimeString("es-ES", { hour12: false })}
              </p>
           </div>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
            Sincronización Cloud OK
          </p>
        </div>
      </header>

      {/* Main Stats Grid */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
        
        {/* Active Workers Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <h2 className="text-lg font-bold flex items-center gap-3 text-white uppercase tracking-tight italic">
              <Users className="text-[#F55B1F]" /> Colaboradores en Operación
            </h2>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Personal en Planta</span>
                <span className="bg-[#F55B1F] px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">
                  {activeWorkers.length} Activos
                </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar rounded-[2rem] border border-white/5 bg-[#1B2031] shadow-2xl flex flex-col">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/10">
                    <Loader2 className="animate-spin" size={40} />
                    <p className="text-xs font-black uppercase tracking-widest">Sincronizando...</p>
                </div>
            ) : activeWorkers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-white/10 p-20 text-center">
                <div className="h-24 w-24 rounded-full border-2 border-dashed border-white/5 flex items-center justify-center">
                    <Users size={48} />
                </div>
                <div>
                   <p className="text-sm font-black uppercase tracking-[0.3em] text-white/20">Planta en Espera</p>
                   <p className="text-[10px] font-medium mt-2 max-w-[250px]">No se detectan relojes activos en este momento</p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#1B2031] border-b border-white/5 z-10">
                  <tr>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">Colaborador</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">OT Destino</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">Proyecto</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30">Desde</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Tiempo en Turno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activeWorkers.map((worker, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl brand-gradient flex items-center justify-center font-black text-white shadow-inner">{worker.name.charAt(0)}</div>
                        <span className="font-bold text-white tracking-tight text-base">{worker.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-orange-400 italic uppercase">OT-{worker.otId.slice(0,5)}</span>
                        <p className="text-[10px] text-white/40 font-bold uppercase truncate max-w-[150px]">{worker.otName}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{worker.project || "—"}</span>
                      </td>
                      <td className="px-8 py-6 font-mono text-sm text-white/20">{new Date(worker.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 text-emerald-400 font-mono font-black text-xl leading-none">
                            <Clock size={16} /> {formatDuration(worker.startTime)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sidebar OTs Activas */}
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-3 text-white">
                <Activity size={20} className="text-[#F55B1F]" />
                <h2 className="text-lg font-bold uppercase tracking-tight italic">Órdenes Activas</h2>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar rounded-[2rem] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 p-6 space-y-4">
                {activeOTs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-10">
                        <Package size={40} className="mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Sin OTs en proceso</p>
                    </div>
                ) : (
                    activeOTs.map(ot => (
                        <div key={ot.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                            <p className="text-xs font-black text-white uppercase italic tracking-tight truncate">{ot.name}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-[#F55B1F] uppercase tracking-widest">{ot.laborSessions?.filter((s:any) => s.status === "ACTIVE").length} Trabajando</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div className="bg-[#F55B1F] h-full w-1/3 animate-shimmer" />
                            </div>
                        </div>
                    ))
                )}
           </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="px-8 py-4 bg-[#0D1117] border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">© 2024 MJR Estructuras Metálicas</p>
            <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Plataforma de Control Industrial</p>
            </div>
        </div>
        <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Cloud Monitoring Active</p>
      </footer>
    </div>
  );
}
