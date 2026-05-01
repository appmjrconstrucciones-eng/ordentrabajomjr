"use client";

import { useState, useRef } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { useOneDrive } from "@/hooks/useOneDrive";
import type { Contract } from "@/types/contract";
import { db, dbRef } from "@/lib/firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HardHat, Link2, Scale, User, Loader2, CheckCircle2, X, Package, FileUp, LogIn
} from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export function NewWorkOrderForm({ onClose, onSuccess, initialData }: Props) {
  const { data: contracts, loading } = useFirestoreCollection<Contract>("contracts", [], dbRef);
  const { data: users, loading: loadingUsers } = useFirestoreCollection<any>("users", [], db);
  const { uploadBlueprint, isUploading, user: microsoftUser, login } = useOneDrive();
  
  const leaders = users.filter(u => u.role === "LEADER");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: initialData?.name || "",
    projectId: initialData?.projectId || "__none__",
    leaderId: initialData?.leaderId || "",
    steelWeightKg: initialData?.steelWeightKg?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const isEditing = !!initialData;

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const activeContracts = contracts.filter(
    (c) => !c.status || c.status === "Activo" || c.status === "ACTIVE"
  );

  const handleContractChange = (contractId: string) => {
    set("projectId", contractId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.leaderId || !form.steelWeightKg) return;

    setSaving(true);
    try {
      let finalDocId = initialData?.id;

      const projectTitle = form.projectId !== "__none__" 
        ? contracts.find(c => c.id === form.projectId)?.title 
        : "OT Independiente";

      if (isEditing) {
        await updateDoc(doc(db, "work_orders", initialData.id), {
          ...form,
          steelWeightKg: parseFloat(form.steelWeightKg),
          projectTitle
        });
      } else {
        // 1. Crear documento en Firestore primero para obtener el ID
        const docRef = await addDoc(collection(db, "work_orders"), {
          ...form,
          steelWeightKg: parseFloat(form.steelWeightKg),
          status: "PENDING",
          createdAt: new Date().toISOString(),
          projectTitle
        });
        finalDocId = docRef.id;
      }

      // 2. Si hay un archivo, subirlo a OneDrive usando el ID de la OT
      if (selectedFile && microsoftUser && finalDocId) {
        const blueprintUrl = await uploadBlueprint(selectedFile, finalDocId);
        if (blueprintUrl) {
          // 3. Actualizar el documento con la URL del plano
          await updateDoc(doc(db, "work_orders", finalDocId), {
            blueprintUrl,
            blueprintName: selectedFile.name
          });
        }
      }

      setSaved(true);
      setTimeout(() => { onSuccess?.(); onClose(); }, 1200);
    } catch (err) {
      console.error("Error al guardar OT:", err);
      alert("Error al guardar la orden de trabajo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#1B2031] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#1B2031]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl brand-gradient flex items-center justify-center shadow-lg shadow-orange-500/20">
              <HardHat size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{isEditing ? "Editar / Reasignar OT" : "Nueva Orden de Trabajo"}</h2>
              <p className="text-[11px] text-white/35 font-medium">{isEditing ? "Actualizar parámetros de producción" : "Configuración de parámetros operativos"}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">

          {/* Proyecto base */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] flex items-center gap-2">
              <Link2 size={12} className="text-[#F55B1F]" /> Proyecto Asociado (Opcional)
            </Label>
            {loading ? (
              <div className="flex items-center gap-2 h-11 px-4 rounded-xl bg-white/5 border border-white/8 text-white/30 text-sm">
                <Loader2 size={15} className="animate-spin" /> Cargando base de proyectos...
              </div>
            ) : (
              <Select value={form.projectId} onValueChange={handleContractChange}>
                <SelectTrigger className="bg-white/5 border-white/8 text-white h-11 px-4 rounded-xl text-sm focus:ring-[#F55B1F] focus:border-[#F55B1F] w-full transition-all hover:bg-white/[0.07]">
                  <SelectValue placeholder="Seleccionar contrato o proyecto maestro...">
                    {form.projectId !== "__none__" 
                      ? contracts.find(c => c.id === form.projectId)?.title || "Cargando nombre..."
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1B2031] border-white/10 text-white min-w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="__none__" className="text-white/40 focus:bg-white/10 focus:text-white cursor-pointer py-3 text-xs">
                    — OT independiente (sin proyecto referenciado) —
                  </SelectItem>
                  {activeContracts.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="text-white focus:bg-[#F55B1F]/10 focus:text-white cursor-pointer py-2 transition-colors"
                    >
                      <span className="font-bold text-sm tracking-tight">{c.title || "Sin título"}</span>
                      {c.client && (
                        <span className="text-[10px] text-white/30 ml-2 uppercase font-black tracking-tighter">— {c.client}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Nombre OT */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] flex items-center gap-2">
              Nombre de la Orden de Trabajo *
            </Label>
            <Input
              required
              placeholder="Ej: Fabricación de Vigas IPE-200"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="bg-white/5 border-white/8 text-white placeholder:text-white/20 h-11 px-4 rounded-xl text-sm focus-visible:ring-[#F55B1F] transition-all focus-visible:bg-white/10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] flex items-center gap-2">
                <User size={12} className="text-[#F55B1F]" /> Líder Responsable *
              </Label>
              <Select value={form.leaderId} onValueChange={(v) => set("leaderId", v)}>
                <SelectTrigger className="bg-white/5 border-white/8 text-white h-11 px-4 rounded-xl text-sm focus:ring-[#F55B1F] hover:bg-white/[0.07]">
                  <SelectValue placeholder={loadingUsers ? "Cargando..." : "Asignar líder..."}>
                    {form.leaderId ? (leaders.find(l => l.id === form.leaderId)?.name || "Líder seleccionado") : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1B2031] border-white/10 text-white">
                  {leaders.length === 0 ? (
                    <div className="p-3 text-[10px] text-white/30 uppercase font-black text-center italic">No hay líderes registrados</div>
                  ) : (
                    leaders.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="focus:bg-white/5 focus:text-white py-2.5">
                        {l.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] flex items-center gap-2">
                <Scale size={12} className="text-[#F55B1F]" /> Masa Total Estimada (Kg) *
              </Label>
              <Input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00 kg"
                value={form.steelWeightKg}
                onChange={(e) => set("steelWeightKg", e.target.value)}
                className="bg-white/5 border-white/8 text-white placeholder:text-white/20 h-11 px-4 rounded-xl text-sm font-mono focus-visible:ring-[#F55B1F] transition-all"
              />
            </div>
          </div>

          {/* Adjuntar Plano (OneDrive Integration) */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-white/40 uppercase tracking-[0.15em] flex items-center gap-2">
              Documentación Técnica
            </Label>
            
            {!microsoftUser ? (
               <Button 
                type="button" 
                variant="outline" 
                onClick={login}
                className="w-full h-11 rounded-xl border-dashed border-[#F55B1F]/30 bg-[#F55B1F]/5 text-[#F55B1F] hover:bg-[#F55B1F]/10 transition-all text-xs font-bold"
              >
                <LogIn size={15} className="mr-2" /> Conectar OneDrive para Adjuntar Planos
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  className="hidden" 
                  accept=".pdf,.dwg,.zip,.png,.jpg"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full h-11 rounded-xl border-dashed transition-all text-xs font-semibold ${
                    selectedFile 
                    ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" 
                    : "border-white/15 bg-white/2 text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {selectedFile ? (
                    <><CheckCircle2 size={15} className="mr-2" /> {selectedFile.name}</>
                  ) : (
                    <><FileUp size={15} className="mr-2" /> Seleccionar Plano Técnico</>
                  )}
                </Button>
                {selectedFile && (
                  <p className="text-[9px] text-white/30 text-center italic">
                    El archivo se guardará en OneDrive automáticamente al crear la OT
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/5 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white h-12 rounded-xl text-sm font-bold"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={saving || isUploading || saved}
              className="flex-1 h-12 rounded-xl brand-gradient text-white text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saved ? (
                <div className="flex items-center gap-2"><CheckCircle2 size={18} /> {isEditing ? "Actualizada" : "Creada"}</div>
              ) : (saving || isUploading) ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> 
                  {isUploading ? "Subiendo Plano..." : "Guardando..."}
                </div>
              ) : (
                isEditing ? "Actualizar OT" : "Generar Orden"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
