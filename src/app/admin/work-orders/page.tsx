"use client";

import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db, dbRef } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePlus, Search, HardHat, Package, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Contract } from "@/types/contract";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewWorkOrderForm } from "@/components/forms/NewWorkOrderForm";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    IN_PROGRESS: { label: "Producción", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    PAUSED:      { label: "Pausada",    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    PENDING:     { label: "En Espera",  cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    COMPLETED:   { label: "Finalizado", cls: "text-white/30 bg-white/5 border-white/10" },
};

export default function WorkOrdersList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"leader" | "project">("leader");

  const { data: workOrders, loading: otLoading } = useFirestoreCollection<any>("work_orders", [], db);
  const { data: users, loading: usersLoading } = useFirestoreCollection<any>("users", [], db);
  const { data: contracts } = useFirestoreCollection<Contract>("contracts", [], dbRef);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "ADMIN")) {
      router.push("/admin");
    }
  }, [user, authLoading, router]);

  if (authLoading || otLoading || usersLoading) return (
    <div className="h-full flex items-center justify-center text-white/20 font-bold uppercase tracking-widest gap-2 py-40">
       <Loader2 className="animate-spin" /> Sincronizando Maestro de Órdenes...
    </div>
  );

  const leaders = users.filter(u => u.role === "LEADER");
  
  // Agrupar OTs por líder
  const groupedByLeader: Record<string, any[]> = {
    unassigned: []
  };

  leaders.forEach(l => {
    groupedByLeader[l.id] = [];
  });

  const filteredOrders = workOrders.filter(wo => 
    wo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wo.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredOrders.forEach(wo => {
    if (wo.leaderId && groupedByLeader[wo.leaderId]) {
        groupedByLeader[wo.leaderId].push(wo);
    } else {
        groupedByLeader.unassigned.push(wo);
    }
  });

  // Agrupar OTs por proyecto
  const groupedByProject: Record<string, any[]> = {
    independent: []
  };

  contracts.forEach(c => {
    groupedByProject[c.id] = [];
  });

  filteredOrders.forEach(wo => {
    if (wo.projectId && wo.projectId !== "__none__" && groupedByProject[wo.projectId]) {
        groupedByProject[wo.projectId].push(wo);
    } else {
        groupedByProject.independent.push(wo);
    }
  });

  return (
    <div className="flex flex-col gap-9">
      {showForm && <NewWorkOrderForm onClose={() => setShowForm(false)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
             <Package className="text-[#F55B1F]" size={36} /> Registro Maestro
          </h1>
          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] ml-1">
             Control total de manufactura por líder de equipo
          </p>
        </div>
        <Button 
            onClick={() => setShowForm(true)}
            className="brand-gradient text-white shadow-xl shadow-orange-500/20 hover:opacity-95 transition-all font-black uppercase tracking-widest h-12 px-8 rounded-2xl"
        >
          <FilePlus className="mr-2 h-5 w-5" /> Generar OT
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20" />
                <Input
                placeholder="Filtrar por nombre o proyecto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#1B2031] border-white/5 pl-12 h-12 rounded-2xl text-sm text-white focus-visible:ring-[#F55B1F] shadow-xl"
                />
            </div>
            
            <div className="flex bg-[#1B2031] p-1 rounded-2xl border border-white/5 shadow-xl">
                <button 
                    onClick={() => setViewMode("leader")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'leader' ? 'brand-gradient text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
                >
                    Vista por Líder
                </button>
                <button 
                    onClick={() => setViewMode("project")}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'project' ? 'brand-gradient text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
                >
                    Vista por Proyecto
                </button>
            </div>
        </div>
        <Button 
            onClick={() => setShowForm(true)}
            className="brand-gradient text-white shadow-xl shadow-orange-500/20 hover:opacity-95 transition-all font-black uppercase tracking-widest h-12 px-8 rounded-2xl"
        >
          <FilePlus className="mr-2 h-5 w-5" /> Generar OT
        </Button>
      </div>

      <div className="space-y-12">
        {viewMode === "leader" ? (
            <>
                {/* Sin Líder Asignado (Huérfanas) */}
                {groupedByLeader.unassigned.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <AlertCircle className="text-red-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-white uppercase tracking-widest">Sin Líder Asignado</h2>
                                <p className="text-[10px] text-red-400/50 uppercase font-bold tracking-tighter italic">Requiere atención inmediata</p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {groupedByLeader.unassigned.map(wo => <OTCard key={wo.id} wo={wo} />)}
                        </div>
                    </div>
                )}

                {/* Listado por Líderes */}
                {leaders.map(leader => {
                    const orders = groupedByLeader[leader.id];
                    if (orders.length === 0 && searchTerm) return null;

                    return (
                        <div key={leader.id} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white shadow-inner">
                                        {leader.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white uppercase italic tracking-tight">{leader.name}</h2>
                                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Líder de Equipo · {orders.length} OTs activas</p>
                                    </div>
                                </div>
                            </div>
                            {orders.length === 0 ? (
                                <div className="p-8 rounded-[2rem] border border-dashed border-white/5 flex items-center justify-center">
                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">No tiene órdenes asignadas</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {orders.map(wo => <OTCard key={wo.id} wo={wo} />)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </>
        ) : (
            <>
                {/* Listado por Proyecto */}
                {contracts.map(contract => {
                    const orders = groupedByProject[contract.id];
                    if (orders.length === 0 && searchTerm) return null;

                    return (
                        <div key={contract.id} className="space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4 px-2">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner">
                                        <Package className="text-[#F55B1F]" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white uppercase italic tracking-tight">{contract.title}</h2>
                                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Contrato: {contract.client || "Cliente Externo"} · {orders.length} OTs registradas</p>
                                    </div>
                                </div>
                            </div>
                            {orders.length === 0 ? (
                                <div className="p-8 rounded-[2rem] border border-dashed border-white/5 flex items-center justify-center">
                                    <p className="text-[10px] font-black text-white/10 uppercase tracking-widest italic">Sin órdenes vinculadas a este proyecto</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {orders.map(wo => <OTCard key={wo.id} wo={wo} />)}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Independientes */}
                {groupedByProject.independent.length > 0 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 px-2">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <AlertCircle className="text-white/20" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Operaciones Independientes</h2>
                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Órdenes sin proyecto referenciado</p>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {groupedByProject.independent.map(wo => <OTCard key={wo.id} wo={wo} />)}
                        </div>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}

function OTCard({ wo }: { wo: any }) {
    const router = useRouter();
    const s = STATUS_MAP[wo.status] ?? STATUS_MAP.PENDING;

    return (
        <div 
            onClick={() => router.push(`/admin/work-order/${wo.id}`)}
            className="group p-6 rounded-[2rem] bg-[#1B2031] border border-white/5 shadow-xl hover:border-[#F55B1F]/30 transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute right-0 top-0 h-24 w-24 bg-[#F55B1F]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#F55B1F]/10 transition-all" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <HardHat size={20} className="text-white/20 group-hover:text-white transition-colors" />
                </div>
                <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${s.cls}`}>
                    {s.label}
                </span>
            </div>

            <div className="space-y-1 mb-6 relative z-10">
                <h3 className="text-base font-black text-white uppercase italic tracking-tight group-hover:text-[#F55B1F] transition-colors leading-none truncate">
                    {wo.name}
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest truncate">
                    {wo.projectTitle || "S/P"}
                </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-2">
                    <User size={12} className="text-white/20" />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{wo.steelWeightKg || 0} Kg</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#F55B1F] transition-all">
                    <ArrowRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
            </div>
        </div>
    );
}
