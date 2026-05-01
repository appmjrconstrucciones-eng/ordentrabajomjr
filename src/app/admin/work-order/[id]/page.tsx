"use client";

import { useState, use, useEffect } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/lib/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { 
  ArrowLeft, HardHat, Package, Users, Clock, CheckCircle2, 
  ExternalLink, Scale, Plus, Trash2, Loader2, Play, Hash, Calculator, LogIn, LogOut
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: workOrders, loading: loadingOT } = useFirestoreCollection<any>("work_orders", [], db);
  const { data: collaborators } = useFirestoreCollection<any>("users", [], db);
  const { data: supplies } = useFirestoreCollection<any>("supplies", [], db);

  const ot = workOrders.find(w => w.id === id);
  const [updating, setUpdating] = useState(false);
  
  // Estados para el registro de insumos
  const [selectedSupplyId, setSelectedSupplyId] = useState<string>("");
  const [supplyQuantity, setSupplyQuantity] = useState<string>("1");

  if (loadingOT) return (
    <div className="h-96 flex flex-col items-center justify-center text-white/20 gap-4">
        <Loader2 className="animate-spin" size={32} />
        <p className="text-xs font-black uppercase tracking-widest">Cargando expediente técnico...</p>
    </div>
  );

  if (!ot) return (
    <div className="p-20 text-center text-white/40">OT no encontrada</div>
  );

  const handleStatusChange = async (newStatus: string) => {
    // Verificar si hay colaboradores activos antes de pausar o completar
    const activeSessions = ot.laborSessions?.filter((s: any) => s.status === "ACTIVE") || [];
    
    if (activeSessions.length > 0 && (newStatus === "PAUSED" || newStatus === "COMPLETED")) {
      const action = newStatus === "PAUSED" ? "pausar" : "finalizar";
      if (confirm(`Hay ${activeSessions.length} colaborador(es) con el reloj activo. ¿Deseas marcar la SALIDA de todos automáticamente para poder ${action} la orden?`)) {
        await clockOutAllCollaborators(activeSessions);
      } else {
        return; // Detener el cambio de estado
      }
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, "work_orders", id), { status: newStatus });
    } finally {
      setUpdating(false);
    }
  };

  const clockOutAllCollaborators = async (activeSessions: any[]) => {
    setUpdating(true);
    try {
      const endTime = new Date().toISOString();
      let currentSessions = [...(ot.laborSessions || [])];

      for (const session of activeSessions) {
        const startTime = new Date(session.startTime);
        const diffMs = new Date(endTime).getTime() - startTime.getTime();
        const diffHours = Math.max(0.01, diffMs / (1000 * 60 * 60)); // Mínimo 0.01h para evitar ceros
        
        const collab = collaborators.find(c => c.id === session.collabId);
        const hourlyRate = session.hourlyRate || collab?.hourlyRate || 0;
        const sessionCost = diffHours * hourlyRate;

        // Remover sesión activa
        currentSessions = currentSessions.filter(s => s !== session);
        
        // Agregar sesión finalizada
        currentSessions.push({
          ...session,
          endTime,
          durationHours: diffHours,
          hourlyRate,
          totalCost: sessionCost,
          status: "COMPLETED"
        });
      }

      await updateDoc(doc(db, "work_orders", id), {
        laborSessions: currentSessions
      });
    } finally {
      setUpdating(false);
    }
  };

  const addCollaborator = async (collabId: string) => {
    const collab = collaborators.find(c => c.id === collabId);
    if (!collab) return;
    await updateDoc(doc(db, "work_orders", id), {
      assignedCollaborators: arrayUnion({ 
        id: collab.id, 
        name: collab.name, 
        specialty: collab.specialty,
        hourlyRate: collab.hourlyRate || 0 
      })
    });
  };

  const removeCollaborator = async (collab: any) => {
     await updateDoc(doc(db, "work_orders", id), {
      assignedCollaborators: arrayRemove(collab)
    });
  };

  // --- Lógica de Reloj de Tiempo ---
  const startLaborSession = async (collab: any) => {
    // REGLA: Un colaborador no puede estar activo en dos OTs a la vez
    const isWorkingElsewhere = workOrders.some(otherOT => 
        otherOT.id !== id && 
        otherOT.laborSessions?.some((s: any) => s.collabId === collab.id && s.status === "ACTIVE")
    );

    if (isWorkingElsewhere) {
        const otherOT = workOrders.find(o => o.laborSessions?.some((s: any) => s.collabId === collab.id && s.status === "ACTIVE"));
        alert(`El colaborador ${collab.name} ya tiene un reloj activo en la OT: ${otherOT?.name || "otra orden"}. Debe marcar salida allá primero.`);
        return;
    }

    setUpdating(true);
    try {
      const session = {
        collabId: collab.id,
        name: collab.name,
        startTime: new Date().toISOString(),
        status: "ACTIVE"
      };
      await updateDoc(doc(db, "work_orders", id), {
        laborSessions: arrayUnion(session)
      });
    } finally {
      setUpdating(false);
    }
  };

  const endLaborSession = async (session: any) => {
    setUpdating(true);
    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(session.startTime);
      const diffMs = new Date(endTime).getTime() - startTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      const collab = collaborators.find(c => c.id === session.collabId);
      const hourlyRate = session.hourlyRate || collab?.hourlyRate || 0;
      const sessionCost = diffHours * hourlyRate;

      // Eliminar la sesión activa y agregar la finalizada
      // Nota: arrayRemove necesita el objeto EXACTO. 
      await updateDoc(doc(db, "work_orders", id), {
        laborSessions: arrayRemove(session)
      });

      await updateDoc(doc(db, "work_orders", id), {
        laborSessions: arrayUnion({
          ...session,
          endTime,
          durationHours: diffHours,
          hourlyRate,
          totalCost: sessionCost,
          status: "COMPLETED"
        })
      });
    } finally {
      setUpdating(false);
    }
  };

  const registerSupplyUsage = async () => {
    const supply = supplies.find(s => s.id === selectedSupplyId);
    const qty = parseFloat(supplyQuantity);
    if (!supply || isNaN(qty) || qty <= 0) return;

    setUpdating(true);
    try {
      await updateDoc(doc(db, "work_orders", id), {
        consumedSupplies: arrayUnion({ 
          id: supply.id, 
          name: supply.name, 
          unitCost: supply.cost, 
          quantity: qty,
          totalCost: supply.cost * qty,
          addedAt: new Date().toISOString() 
        })
      });
      setSelectedSupplyId("");
      setSupplyQuantity("1");
    } finally {
      setUpdating(false);
    }
  };

  const removeSupply = async (supply: any) => {
     await updateDoc(doc(db, "work_orders", id), {
      consumedSupplies: arrayRemove(supply)
    });
  };

  const activeOTCollaborators = collaborators.filter(c => c.role === "COLLABORATOR");
  
  const totalInsumos = ot.consumedSupplies?.reduce((acc: number, s: any) => acc + (s.totalCost || 0), 0) || 0;
  const totalManoObra = ot.laborSessions?.filter((s: any) => s.status === "COMPLETED").reduce((acc: number, s: any) => acc + (s.totalCost || 0), 0) || 0;
  const totalGeneral = totalInsumos + totalManoObra;

  // --- Resumen por Categoría (Especialidad) ---
  const laborBySpecialty = (ot.laborSessions || []).reduce((acc: Record<string, { hours: number, cost: number }>, session: any) => {
    const collab = collaborators.find(c => c.id === session.collabId);
    const specialty = collab?.specialty || "General / Líder";
    
    if (!acc[specialty]) acc[specialty] = { hours: 0, cost: 0 };
    
    if (session.status === "COMPLETED") {
        acc[specialty].hours += session.durationHours || 0;
        acc[specialty].cost += session.totalCost || 0;
    } else if (session.status === "ACTIVE") {
        const start = new Date(session.startTime).getTime();
        const now = new Date().getTime();
        const diffHours = Math.max(0, (now - start) / (1000 * 60 * 60));
        acc[specialty].hours += diffHours;
        const rate = session.hourlyRate || collab?.hourlyRate || 0;
        acc[specialty].cost += diffHours * rate;
    }
    
    return acc;
  }, {});

  const sortedSpecialties = Object.entries(laborBySpecialty).sort((a, b) => b[1].cost - a[1].cost);

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
           <Link href="/admin" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all">
             <ArrowLeft size={20} />
           </Link>
           <div>
             <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Expediente OT-{id.slice(0, 5).toUpperCase()}</h1>
             <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1">MJR · Sistema de Control de Producción</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
            {ot.status === "PENDING" && (
                <Button onClick={() => handleStatusChange("IN_PROGRESS")} disabled={updating} className="brand-gradient text-white font-black uppercase tracking-widest px-6 h-11 rounded-xl">
                    <Play className="mr-2 h-4 w-4 fill-white" /> Iniciar OT
                </Button>
            )}
            {ot.status === "PAUSED" && (
                <Button onClick={() => handleStatusChange("IN_PROGRESS")} disabled={updating} className="brand-gradient text-white font-black uppercase tracking-widest px-6 h-11 rounded-xl">
                    <Play className="mr-2 h-4 w-4 fill-white" /> Reanudar OT
                </Button>
            )}
            {ot.status === "IN_PROGRESS" && (
                <div className="flex gap-2">
                    <Button onClick={() => handleStatusChange("PAUSED")} disabled={updating} variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white font-black uppercase tracking-widest px-6 h-11 rounded-xl">
                        <Clock className="mr-2 h-4 w-4" /> Pausar
                    </Button>
                    <Button onClick={() => handleStatusChange("COMPLETED")} disabled={updating} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest px-6 h-11 rounded-xl">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar
                    </Button>
                </div>
            )}
            {ot.status === "COMPLETED" && (
                <Badge className="bg-white/5 border-white/10 text-white/40 h-11 px-6 rounded-xl uppercase tracking-widest text-[10px] font-black">OT Finalizada</Badge>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: OT Details */}
        <div className="lg:col-span-2 space-y-8">
            {/* Info Card */}
            <div className="rounded-[2.5rem] bg-[#1B2031] border border-white/5 p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5"><HardHat size={120} /></div>
                <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{ot.name}</h2>
                            <p className="text-[#F55B1F] text-[10px] font-black uppercase tracking-[0.4em] mt-3 bg-[#F55B1F]/5 border border-[#F55B1F]/10 px-3 py-1.5 w-fit rounded-full">
                                Proyecto: {ot.projectTitle || "Independiente"}
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <p className="text-[10px] text-white/20 uppercase font-black tracking-widest mb-1">Masa de Estructura</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-mono font-black text-white">{(ot.steelWeightKg || 0).toLocaleString()}</span>
                                <span className="text-sm font-black text-white/20 uppercase">Kg</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest whitespace-nowrap">Inversión Total</p>
                            <p className="text-xl font-bold text-emerald-400 font-mono tracking-tighter italic">₡{totalGeneral.toLocaleString()}</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Estado</p>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${
                                ot.status === 'IN_PROGRESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                ot.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                ot.status === 'PENDING' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 
                                'bg-white/5 text-white/40 border border-white/10'
                            }`}>
                                {ot.status === 'IN_PROGRESS' ? 'Producción' : ot.status === 'PAUSED' ? 'Pausada' : ot.status === 'PENDING' ? 'En Espera' : 'Finalizado'}
                            </span>
                        </div>
                        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
                            <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Fecha Inicio</p>
                            <p className="text-xs text-white/60 font-bold">{new Date(ot.createdAt).toLocaleDateString()}</p>
                        </div>
                        {ot.blueprintUrl && (
                            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 space-y-1">
                                <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Planos</p>
                                <a href={ot.blueprintUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 font-bold hover:underline flex items-center gap-1 group">
                                    <Package size={12} className="text-blue-400/50 group-hover:text-blue-400 transition-colors" /> Ver Plano <ExternalLink size={10} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Insumos Consumidos */}
            <div className="rounded-[2.5rem] border border-white/5 bg-[#1B2031]/30 p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 shadow-inner">
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight uppercase italic">Registro de Suministros</h3>
                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Costo acumulado: ₡{totalInsumos.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Formulario de registro rápido */}
                {ot.status !== 'COMPLETED' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 rounded-[1.5rem] bg-white/[0.03] border border-dashed border-white/10 items-end">
                        <div className="md:col-span-6 space-y-2">
                             <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Seleccionar Insumo (Maestro)</label>
                             <Select onValueChange={setSelectedSupplyId} value={selectedSupplyId}>
                                <SelectTrigger className="bg-[#1B2031] border-white/10 text-white rounded-xl h-11 text-xs">
                                    <SelectValue placeholder="Elegir material...">
                                        {selectedSupplyId ? (supplies.find(s => s.id === selectedSupplyId)?.name || "Elegir material...") : "Elegir material..."}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-[#1B2031] border-white/10 text-white">
                                    {supplies.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name} (₡{s.cost}/unit)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Cantidad</label>
                            <Input 
                                type="number" 
                                value={supplyQuantity} 
                                onChange={(e) => setSupplyQuantity(e.target.value)}
                                className="bg-[#1B2031] border-white/10 text-white h-11 rounded-xl text-center font-mono font-bold"
                            />
                        </div>
                        <div className="md:col-span-3">
                            <Button 
                                onClick={registerSupplyUsage} 
                                disabled={!selectedSupplyId || updating}
                                className="w-full brand-gradient text-white font-black uppercase tracking-widest h-11 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                            >
                                {updating ? <Loader2 className="animate-spin" /> : <><Plus size={16} className="mr-1" /> Registrar</>}
                            </Button>
                        </div>
                    </div>
                )}
                
                <div className="space-y-4">
                    {(!ot.consumedSupplies || ot.consumedSupplies.length === 0) ? (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-white/10 text-xs font-bold uppercase tracking-[0.2em]">
                            Sin consumos registrados
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead className="border-b border-white/5">
                                    <tr>
                                        <th className="px-4 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest">Insumo</th>
                                        <th className="px-4 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest text-center">Cant.</th>
                                        <th className="px-4 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest text-center">Costo Unit.</th>
                                        <th className="px-4 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest text-right">Subtotal</th>
                                        <th className="px-4 py-4 text-[9px] font-black text-white/20 uppercase tracking-widest w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ot.consumedSupplies.map((s: any, idx: number) => (
                                        <tr key={idx} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-4 py-5">
                                                <p className="text-sm font-bold text-white uppercase tracking-tight">{s.name}</p>
                                                <p className="text-[9px] text-white/20 font-bold uppercase tracking-tighter mt-0.5">{new Date(s.addedAt).toLocaleString()}</p>
                                            </td>
                                            <td className="px-4 py-5 text-center font-mono font-bold text-white/80">{s.quantity}</td>
                                            <td className="px-4 py-5 text-center font-mono text-xs text-white/40">₡{s.unitCost}</td>
                                            <td className="px-4 py-5 text-right font-mono font-black text-emerald-400">₡{(s.totalCost || 0).toLocaleString()}</td>
                                            <td className="px-4 py-5 text-right w-10">
                                                {ot.status !== 'COMPLETED' && (
                                                    <button onClick={() => removeSupply(s)} className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"><Trash2 size={16} /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Historial de Tiempos y Mano de Obra */}
            <div className="rounded-[2.5rem] border border-white/5 bg-[#1B2031]/30 p-8 space-y-8">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
                        <Clock size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight uppercase italic">Planilla de Producción</h3>
                        <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Costo mano de obra: ₡{totalManoObra.toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {(!ot.laborSessions || ot.laborSessions.length === 0) ? (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl text-white/10 text-xs font-bold uppercase tracking-[0.2em]">
                            Sin registros de tiempo
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                             {ot.laborSessions.map((session: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                                    {session.status === 'ACTIVE' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 animate-pulse" />}
                                    <div className="flex items-center gap-4">
                                        <div className="h-11 w-11 rounded-xl brand-gradient flex items-center justify-center text-white font-black">{session.name.charAt(0)}</div>
                                        <div>
                                            <p className="text-sm font-bold text-white uppercase tracking-tight">{session.name}</p>
                                            {session.status === 'ACTIVE' ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                     <span className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce" />
                                                     <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest italic">Trabajando desde {new Date(session.startTime).toLocaleTimeString()}</span>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight mt-1">
                                                    {new Date(session.startTime).toLocaleTimeString()} → {new Date(session.endTime).toLocaleTimeString()} ({session.durationHours.toFixed(2)}h)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[9px] text-white/20 uppercase font-black mb-1">Inversión Laboral</p>
                                            <p className={`text-sm font-mono font-black ${session.status === 'ACTIVE' ? 'text-white/20' : 'text-emerald-400'}`}>
                                                ₡{(session.totalCost || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        {session.status === 'ACTIVE' && (
                                            <Button onClick={() => endLaborSession(session)} className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                <LogOut size={14} className="mr-2" /> Salida
                                            </Button>
                                        )}
                                    </div>
                                </div>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Collaborators */}
        <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-white/5 bg-[#1B2031] p-8 space-y-6 h-fit shadow-2xl">
                <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-inner">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight uppercase italic">Equipo Designado</h3>
                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">Gestión de tiempos</p>
                        </div>
                    </div>
                
                {ot.status !== 'COMPLETED' && (
                    <Select onValueChange={addCollaborator}>
                        <SelectTrigger className="w-full bg-white/5 border-white/10 text-white rounded-2xl h-14 text-xs font-black uppercase tracking-[0.2em] shadow-inner">
                            <SelectValue placeholder="+ Vincular Personal al Proyecto" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1B2031] border-white/10 text-white">
                            {activeOTCollaborators.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name} — {c.specialty} (₡{c.hourlyRate}/h)</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <div className="space-y-3">
                    {(!ot.assignedCollaborators || ot.assignedCollaborators.length === 0) ? (
                        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-white/10 text-xs font-black uppercase tracking-widest">
                            Asigne personal primero
                        </div>
                    ) : (
                        ot.assignedCollaborators.map((c: any, idx: number) => {
                            const isWorking = ot.laborSessions?.some((s: any) => s.collabId === c.id && s.status === "ACTIVE");
                            return (
                                <div key={idx} className="flex flex-col gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl brand-gradient flex items-center justify-center text-white font-black text-base shadow-lg shadow-orange-500/10">{c.name.charAt(0)}</div>
                                            <div>
                                                <p className="text-base font-bold text-white leading-tight">{c.name}</p>
                                                <p className="text-[10px] text-[#F55B1F] font-black uppercase tracking-[0.2em] mt-1">{c.specialty}</p>
                                            </div>
                                        </div>
                                        {ot.status !== 'COMPLETED' && (
                                            <button onClick={() => removeCollaborator(c)} className="text-white/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"><Trash2 size={18} /></button>
                                        )}
                                    </div>
                                    
                                    {/* Resumen de tiempo de este colaborador en la OT */}
                                    <div className="flex items-center justify-between px-1">
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Tiempo Acumulado</p>
                                            <p className="text-xs font-mono font-bold text-white/60">
                                                {ot.laborSessions?.filter((l:any) => l.collabId === c.id && l.status === "COMPLETED")
                                                   .reduce((acc:number, s:any) => acc + (s.durationHours || 0), 0).toFixed(2)}h
                                            </p>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <p className="text-[8px] text-white/20 uppercase font-bold tracking-widest">Inversión (₡)</p>
                                            <p className="text-xs font-mono font-bold text-emerald-400">
                                                ₡{ot.laborSessions?.filter((l:any) => l.collabId === c.id && l.status === "COMPLETED")
                                                   .reduce((acc:number, s:any) => acc + (s.totalCost || 0), 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {ot.status === "IN_PROGRESS" && (
                                        <div className="flex gap-2">
                                            {!isWorking ? (
                                                <Button 
                                                    onClick={() => startLaborSession(c)}
                                                    className="w-full h-10 rounded-xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all flex items-center gap-2"
                                                >
                                                    <LogIn size={14} /> Registrar Entrada
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={() => {
                                                        const session = ot.laborSessions.find((s:any) => s.collabId === c.id && s.status === "ACTIVE");
                                                        if (session) endLaborSession(session);
                                                    }}
                                                    className="w-full h-10 rounded-xl bg-red-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all flex items-center gap-2"
                                                >
                                                    <LogOut size={14} /> Marcar Salida
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            
            {/* Resumen Financiero Dinámico */}
            <div className="rounded-[2.5rem] bg-gradient-to-br from-[#1B2031] to-[#0D1117] border border-white/5 p-8 shadow-2xl space-y-8">
                <div className="flex items-center gap-3">
                    <Calculator size={20} className="text-[#F55B1F]" />
                    <h4 className="text-lg font-black text-white italic uppercase tracking-widest">Costos de Producción</h4>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-white/30 text-[10px] font-black uppercase tracking-[0.1em]">
                            <span>Suministros Consumidos</span>
                            <span className="text-white font-mono text-base">₡{totalInsumos.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-[#F55B1F] h-full" style={{ width: `${(totalInsumos/totalGeneral)*100}%` }} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-white/30 text-[10px] font-black uppercase tracking-[0.1em]">
                            <span>Inversión de Mano de Obra</span>
                            <span className="text-white font-mono text-base">₡{totalManoObra.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${(totalManoObra/totalGeneral)*100}%` }} />
                        </div>
                    </div>
                    
                    <div className="h-px bg-white/10 w-full" />
                    
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/20">
                            <span>Relación Costo / Masa</span>
                            <span className="text-white/40 italic">Rendimiento</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-xs font-bold text-white/60 uppercase">Costo por Kilo</p>
                            <p className="text-lg font-black text-[#F55B1F] font-mono tracking-tighter">
                                ₡{ot.steelWeightKg > 0 ? (totalGeneral / ot.steelWeightKg).toLocaleString(undefined, {maximumFractionDigits: 2}) : "0"} <span className="text-[10px] text-white/20">/ Kg</span>
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 w-full" />
                    
                    <div className="flex justify-between items-center group">
                        <p className="text-xs font-black text-[#F55B1F] uppercase tracking-widest">Inversión Total</p>
                        <p className="text-2xl font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform">₡{totalGeneral.toLocaleString()}</p>
                    </div>
                </div>

                {/* Nuevo Resumen por Categoría */}
                <div className="rounded-[2rem] border border-white/5 bg-[#1B2031] p-8 shadow-2xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Users size={18} className="text-[#F55B1F]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Inversión por Categoría</h3>
                            <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">Desglose por especialidad</p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        {sortedSpecialties.length === 0 ? (
                            <p className="text-[10px] text-white/10 uppercase font-black text-center py-4 italic">Sin horas registradas aún</p>
                        ) : sortedSpecialties.map(([spec, data]: [string, any]) => (
                            <div key={spec} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs font-bold text-white group-hover:text-[#F55B1F] transition-colors">{spec}</p>
                                        <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">{data.hours.toFixed(2)} Horas Efectivas</p>
                                    </div>
                                    <p className="text-sm font-black text-white font-mono">₡{data.cost.toLocaleString()}</p>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full brand-gradient transition-all duration-1000" 
                                        style={{ width: `${Math.min(100, (data.cost / (totalManoObra || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
