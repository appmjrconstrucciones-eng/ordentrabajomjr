"use client";

import { useState, useEffect } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useAuth } from "@/providers/AuthProvider";
import type { Contract } from "@/types/contract";
import { db, dbRef } from "@/lib/firebase";
import { NewWorkOrderForm } from "@/components/forms/NewWorkOrderForm";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  FilePlus, Activity, DollarSign, Scale, HardHat, ArrowRight, Loader2, Package, LayoutDashboard, MoreVertical, Trash2, Clock, CheckCircle2
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const KPICard = ({
  label, value, sub, icon: Icon, accent = false, loading = false,
}: {
  label: string; value: string; sub: string; icon: React.ElementType; accent?: boolean; loading?: boolean;
}) => (
  <div
    className={`rounded-[2rem] border p-6 flex flex-col gap-4 shadow-xl transition-all hover:-translate-y-1 ${
      accent
        ? "bg-gradient-to-br from-[#F55B1F]/20 to-[#F55B1F]/5 border-[#F55B1F]/30"
        : "bg-[#1B2031] border-white/5 shadow-black/20"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">{label}</span>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${accent ? "brand-gradient" : "bg-white/5 border border-white/5"}`}>
        <Icon size={18} className={accent ? "text-white" : "text-white/40"} />
      </div>
    </div>
    <div>
      {loading ? (
        <div className="flex items-center gap-2 text-white/30">
          <Loader2 size={16} className="animate-spin" />
        </div>
      ) : (
        <p className={`text-3xl font-black tracking-tighter ${accent ? "text-[#F55B1F]" : "text-white"}`}>{value}</p>
      )}
      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-1.5">{sub}</p>
    </div>
  </div>
);

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  IN_PROGRESS: { label: "Producción", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" },
  PAUSED:      { label: "Pausada",    cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  PENDING:     { label: "En Espera",  cls: "bg-blue-500/10 text-blue-400 border-blue-500/10" },
  COMPLETED:   { label: "Finalizado", cls: "bg-white/5 text-white/30 border-white/10" },
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const { data: contracts, loading: contractsLoading } = useFirestoreCollection<Contract>("contracts", [], dbRef);
  const { data: allWorkOrders, loading: otLoading } = useFirestoreCollection<any>("work_orders", [], db);
  const [editingOT, setEditingOT] = useState<any>(null);

  const handleDeleteOT = async (wo: any) => {
    // REGLA: No se puede eliminar si está finalizada o tiene datos registrados
    const hasSupplies = wo.consumedSupplies?.length > 0;
    const hasLabor = wo.laborSessions?.length > 0;
    const isCompleted = wo.status === "COMPLETED";

    if (isCompleted || hasSupplies || hasLabor) {
        alert("No se puede eliminar esta Orden de Trabajo porque ya contiene registros de producción o se encuentra finalizada. El historial debe ser preservado por integridad de datos.");
        return;
    }

    if (confirm(`¿Estás seguro de eliminar la OT "${wo.name}"? Esta acción no se puede deshacer.`)) {
        try {
            await deleteDoc(doc(db, "work_orders", wo.id));
        } catch (error) {
            alert("Error al eliminar la OT");
        }
    }
  };

  const handleEditOT = (wo: any) => {
    setEditingOT(wo);
    setShowForm(true);
  };

  if (authLoading || !user) return (
    <div className="h-full flex items-center justify-center text-white/20 font-bold uppercase tracking-widest gap-2 py-20">
       <Loader2 className="animate-spin" /> Identificando Usuario...
    </div>
  );

  const myWorkOrders = user.role === "LEADER" 
    ? allWorkOrders.filter(wo => wo.leaderId === user.dbId)
    : allWorkOrders;

  const activeProjects = contracts.filter(
    (c) => !c.status || c.status === "Activo" || c.status === "ACTIVE"
  );

  const isAdmin = user.role === "ADMIN";

  const statusPriority: Record<string, number> = {
    IN_PROGRESS: 0,
    PAUSED: 1,
    PENDING: 2,
    COMPLETED: 3
  };

  const sortedWorkOrders = [...myWorkOrders].sort((a, b) => {
    const pA = statusPriority[a.status] ?? 4;
    const pB = statusPriority[b.status] ?? 4;
    if (pA !== pB) return pA - pB;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <>
      {showForm && (
        <NewWorkOrderForm 
            initialData={editingOT} 
            onClose={() => {
                setShowForm(false);
                setEditingOT(null);
            }} 
        />
      )}

      <div className="flex flex-col gap-9">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
               <LayoutDashboard className="text-[#F55B1F]" size={36} /> 
               {isAdmin ? "Panel de Operaciones" : "Mis Órdenes de Trabajo"}
            </h1>
            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] ml-1">
               {isAdmin ? "Sincronización Total de Taller y Proyectos" : `Bienvenido al sistema MJR, ${user.displayName || user.email}`}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="brand-gradient text-white shadow-xl shadow-orange-500/20 hover:opacity-95 transition-all font-black uppercase tracking-widest h-12 px-8 rounded-2xl"
            >
              <FilePlus className="mr-2 h-5 w-5" />
              Generar OT
            </Button>
          )}
        </div>

        {/* KPIs */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            label={isAdmin ? "Portafolio Activo" : "Mis Órdenes"}
            value={isAdmin ? (contractsLoading ? "—" : String(activeProjects.length)) : String(myWorkOrders.length)}
            sub={isAdmin ? "Contratos en ejecución" : "Asignación total"}
            icon={Activity}
            loading={contractsLoading}
          />
          <KPICard
            label="OT en Proceso"
            value={String(myWorkOrders.filter(w => w.status === 'IN_PROGRESS').length)}
            sub="Personal operando"
            icon={Package}
            loading={otLoading}
          />
          {isAdmin ? (
            <>
                <KPICard
                    label="Acero Procesado"
                    value={`${myWorkOrders.reduce((acc, curr) => acc + (curr.steelWeightKg || 0), 0).toLocaleString()} kg`}
                    sub="Rendimiento de planta"
                    icon={Scale}
                />
                <KPICard
                    label="Inversión Real"
                    value={`₡${allWorkOrders.reduce((acc, curr) => {
                        const insumos = curr.consumedSupplies?.reduce((a:any, s:any) => a + (s.totalCost || 0), 0) || 0;
                        const labor = curr.laborSessions?.filter((l:any) => l.status === "COMPLETED").reduce((a:any, s:any) => a + (s.totalCost || 0), 0) || 0;
                        return acc + insumos + labor;
                    }, 0).toLocaleString()}`}
                    sub="Mano de obra + Insumos"
                    icon={DollarSign}
                    accent
                />
            </>
          ) : (
            <>
                <KPICard
                    label="OT Pausadas"
                    value={String(myWorkOrders.filter(w => w.status === 'PAUSED').length)}
                    sub="En espera de reactivación"
                    icon={Clock}
                />
                <KPICard
                    label="Finalizadas"
                    value={String(myWorkOrders.filter(w => w.status === 'COMPLETED').length)}
                    sub="Historial de éxito"
                    icon={CheckCircle2}
                    accent
                />
            </>
          )}
        </div>

        <div className={`grid gap-9 ${isAdmin ? 'lg:grid-cols-5' : 'grid-cols-1'}`}>
           {/* Columna Proyectos (ADMIN) */}
           {isAdmin && (
             <div className="lg:col-span-2 rounded-[2.5rem] border border-white/5 bg-[#1B2031] shadow-2xl overflow-hidden flex flex-col h-[600px]">
                <div className="px-8 py-7 border-b border-white/5 bg-white/[0.02]">
                   <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">Master de Contratos</h2>
                   <p className="text-[9px] text-[#F55B1F] mt-2 uppercase font-black tracking-widest bg-orange-500/10 px-2 py-1 rounded w-fit">Sincronización Cloud Activada</p>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
                   {contractsLoading ? (
                     <div className="flex flex-col items-center justify-center h-full gap-3 text-white/10">
                       <Loader2 className="animate-spin" size={32} />
                     </div>
                   ) : activeProjects.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full gap-4 text-white/5 italic">
                        Sin contratos vigentes.
                     </div>
                   ) : (
                     activeProjects.map(c => (
                       <div key={c.id} className="p-7 hover:bg-white/[0.02] transition-all group relative overflow-hidden">
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F55B1F] opacity-0 group-hover:opacity-100 transition-all" />
                         <div className="flex justify-between items-start gap-3">
                           <div>
                              <p className="text-base font-bold text-white group-hover:text-[#F55B1F] transition-colors tracking-tight leading-tight uppercase italic">{c.title}</p>
                              <p className="text-[10px] text-white/30 font-black uppercase mt-2 tracking-widest">{c.client || "Cliente Externo"}</p>
                           </div>
                           <button onClick={() => setShowForm(true)} className="h-8 px-4 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[#F55B1F] hover:border-transparent transition-all shadow-lg active:scale-95">
                             + OT
                           </button>
                         </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           {/* Columna OTs */}
            <div className={`rounded-[2.5rem] border border-white/5 bg-[#1B2031] shadow-2xl overflow-hidden flex flex-col ${isAdmin ? 'lg:col-span-3 h-[600px]' : 'min-h-[600px]'}`}>
              <div className="px-8 py-7 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                   <h2 className="text-xs font-black text-white uppercase tracking-[0.3em]">
                      {isAdmin ? "Control de Manufactura" : "Panel de Órdenes"}
                   </h2>
                   <p className="text-[9px] text-[#22D3EE] mt-2 uppercase font-black tracking-widest bg-cyan-500/10 px-2 py-1 rounded w-fit">Estado de Taller Directo</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                {otLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-white/10 py-20">
                     <Loader2 className="animate-spin" size={32} />
                  </div>
                ) : myWorkOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-6 opacity-20 py-20">
                    <Package size={80} strokeWidth={1} />
                    <p className="text-sm font-black uppercase tracking-[0.3em] leading-relaxed">
                       Sin órdenes de taller<br/>{isAdmin ? 'vocalizadas' : 'asignadas'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {sortedWorkOrders.map((wo) => {
                      const s = STATUS_MAP[wo.status] ?? STATUS_MAP.PENDING;
                      return (
                        <div key={wo.id} className="p-8 hover:bg-white/[0.02] transition-all group relative border-l-4 border-l-transparent hover:border-l-[#F55B1F]">
                           <div className="flex justify-between items-center gap-6">
                              <div className="flex gap-6 min-w-0">
                                 <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                                    <HardHat size={28} className="text-white/20 group-hover:text-white transition-colors" />
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-lg font-black text-white truncate uppercase italic tracking-tighter leading-none">{wo.name}</p>
                                    <p className="text-[10px] text-white/30 font-black uppercase mt-3 tracking-[0.1em] truncate">Proyecto: <span className="text-white/60">{wo.projectTitle || "S/P"}</span></p>
                                    <div className="flex items-center gap-3 mt-4">
                                       {isAdmin && <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 shadow-inner">₡{(wo.steelWeightKg || 0).toLocaleString()} Kg</span>}
                                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {isAdmin && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger className="h-10 w-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 transition-all outline-none">
                                        <MoreVertical size={18} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-[#1B2031] border-white/10 text-white min-w-[150px] rounded-2xl p-1 shadow-2xl">
                                        <DropdownMenuItem onClick={() => handleEditOT(wo)} className="flex items-center gap-2 p-3 hover:bg-white/5 focus:bg-white/5 cursor-pointer rounded-xl text-xs font-bold transition-colors">
                                            <HardHat size={14} className="text-[#F55B1F]" /> Editar / Reasignar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteOT(wo)} className="flex items-center gap-2 p-3 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer rounded-xl text-xs font-bold text-red-400 transition-colors">
                                            <Trash2 size={14} /> Eliminar OT
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => router.push(`/admin/work-order/${wo.id}`)}
                                    className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-[#F55B1F] hover:border-transparent hover:text-white text-white/40 transition-all p-0 shadow-lg"
                                >
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </>
  );
}
