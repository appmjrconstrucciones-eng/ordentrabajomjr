"use client";

import { use, useState } from "react";
import { MOCK_WORK_ORDERS, MOCK_USERS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Play, Square, Pause, Plus, Package, HardHat, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

const STAGE_STATUS: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: "Completado", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
  IN_PROGRESS: { label: "En Progreso", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  PENDING: { label: "Pendiente", cls: "bg-white/5 text-white/30 border-white/8" },
};

export default function WorkOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const wo = MOCK_WORK_ORDERS.find((w) => w.id === id);
  const [activeLogs, setActiveLogs] = useState<Record<string, boolean>>({});

  if (!wo)
    return (
      <div className="flex items-center justify-center h-40 text-white/30 text-sm">
        OT no encontrada
      </div>
    );

  const collaborators = MOCK_USERS.filter((u) => u.role === "COLLABORATOR");

  const toggleTimer = (collabId: string) =>
    setActiveLogs((prev) => ({ ...prev, [collabId]: !prev[collabId] }));

  return (
    <div className="flex flex-col gap-5 pb-16">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link href="/leader">
          <button className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/8 text-white/40 hover:bg-white/10 hover:text-white transition-all">
            <ArrowLeft size={16} />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{wo.name}</h1>
          <p className="text-[11px] text-white/35">ID: {wo.id}</p>
        </div>
      </div>

      {/* ── OT Meta Banner ── */}
      <div className="flex items-center justify-between rounded-xl bg-[#1B2031] border border-white/5 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg brand-gradient flex items-center justify-center shrink-0">
            <HardHat size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-widest">Acero Total</p>
            <p className="text-xl font-bold text-white">{wo.steelWeightKg.toLocaleString()} <span className="text-sm font-normal text-white/40">kg</span></p>
          </div>
        </div>
        <Button className="brand-gradient text-white text-xs font-semibold h-8 px-3 shadow-md shadow-orange-500/15 hover:opacity-90 transition-opacity">
          <Package className="mr-1.5 h-3.5 w-3.5" />
          Consumibles
        </Button>
      </div>

      {/* ── Stages Accordion ── */}
      <div>
        <h2 className="text-xs font-black text-white/25 uppercase tracking-widest mb-3">Etapas de Producción</h2>
        <Accordion className="space-y-2">
          {wo.stages.map((stage) => {
            const s = STAGE_STATUS[stage.status] ?? STAGE_STATUS.PENDING;
            return (
              <AccordionItem
                key={stage.id}
                value={stage.id}
                className="border border-white/5 rounded-xl bg-[#1B2031] overflow-hidden data-[state=open]:border-[#F55B1F]/30"
              >
                <AccordionTrigger className="px-4 py-3.5 hover:no-underline hover:bg-white/3 [&>svg]:text-white/25">
                  <div className="flex items-center justify-between w-full pr-3">
                    <div className="flex items-center gap-2.5">
                      {stage.status === "COMPLETED" ? (
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-white">{stage.name}</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 pt-0 border-t border-white/5 bg-black/20">
                  <div className="space-y-3 mt-3">
                    {collaborators.map((collab) => {
                      const isTiming = activeLogs[collab.id];
                      return (
                        <div
                          key={collab.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#1B2031] border border-white/5"
                        >
                          {/* Collaborator info */}
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-[10px] font-bold text-white/50 shrink-0">
                              {collab.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white">{collab.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`relative flex h-1.5 w-1.5 shrink-0 ${isTiming ? "" : ""}`}>
                                  {isTiming && (
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  )}
                                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isTiming ? "bg-emerald-500" : "bg-white/15"}`} />
                                </span>
                                <span className={`text-[10px] ${isTiming ? "text-emerald-400" : "text-white/30"}`}>
                                  {isTiming ? "Trabajando" : "Inactivo"}
                                </span>
                                {isTiming && (
                                  <span className="text-[10px] text-white/20 flex items-center gap-0.5">
                                    <Clock size={9} /> 00:00
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Timer controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isTiming ? (
                              <button
                                onClick={() => toggleTimer(collab.id)}
                                className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-[11px] font-semibold transition-colors"
                              >
                                <Play size={11} /> Iniciar
                              </button>
                            ) : (
                              <>
                                <button className="h-7 w-7 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                                  <Pause size={12} />
                                </button>
                                <button
                                  onClick={() => toggleTimer(collab.id)}
                                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-[11px] font-semibold transition-colors"
                                >
                                  <Square size={11} /> Terminar
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed border-white/10 text-[11px] text-white/25 hover:border-white/20 hover:text-white/40 transition-all">
                      <Plus size={12} /> Agregar colaborador
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
