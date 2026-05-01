"use client";

import { MOCK_WORK_ORDERS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, HardHat } from "lucide-react";
import Link from "next/link";

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  IN_PROGRESS: { label: "En Producción", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
  PENDING:     { label: "Pendiente",     cls: "bg-amber-500/15 text-amber-400 border-amber-500/20",     dot: "bg-amber-500" },
};

export default function LeaderDashboard() {
  const assignedOTs = MOCK_WORK_ORDERS.filter((wo: any) => wo.leaderId === "ldr1");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mis Asignaciones</h1>
        <p className="text-sm text-white/40 mt-0.5">Selecciona una OT para iniciar la producción</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {assignedOTs.map((wo: any) => {
          const s = STATUS_MAP[wo.status] ?? STATUS_MAP.PENDING;
          return (
            <div
              key={wo.id}
              className="group rounded-xl border border-white/5 bg-[#1B2031] p-5 flex flex-col gap-4 hover:border-[#F55B1F]/40 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/5"
            >
              {/* Card Header */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <HardHat size={16} className="text-white/40 group-hover:text-[#F55B1F] transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight group-hover:text-[#F55B1F] transition-colors">
                      {wo.name}
                    </h2>
                    <p className="text-[10px] text-white/35 mt-0.5">ID: {wo.id}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border whitespace-nowrap ${s.cls}`}>
                  {s.label}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-[11px] text-white/35 bg-white/3 rounded-lg px-3 py-2">
                <span><strong className="text-white/70">{wo.steelWeightKg} kg</strong> acero</span>
                <span className="h-3 w-px bg-white/10" />
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {wo.stages.length} etapas
                </span>
              </div>

              <Link href={`/leader/work-order/${wo.id}`} className="w-full">
                <Button className="w-full brand-gradient text-white text-sm font-semibold h-9 shadow-md shadow-orange-500/10 hover:opacity-90 transition-opacity">
                  Gestionar OT <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          );
        })}

        {assignedOTs.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-white/10 rounded-xl text-white/25 text-sm">
            No tienes Órdenes de Trabajo asignadas
          </div>
        )}
      </div>
    </div>
  );
}
