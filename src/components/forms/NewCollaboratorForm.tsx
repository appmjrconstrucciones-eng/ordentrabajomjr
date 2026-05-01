"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
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
  UserPlus, X, Loader2, CheckCircle2, Mail, Shield, HardHat, DollarSign, Save
} from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any; // Si viene inicialData, estamos en modo EDICIÓN
}

export function NewCollaboratorForm({ onClose, onSuccess, initialData }: Props) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "COLLABORATOR",
    specialty: initialData?.specialty || "Soldador",
    hourlyRate: initialData?.hourlyRate?.toString() || "0",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isEditing = !!initialData;

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.role) return;

    // Validación según rol
    if ((form.role === "ADMIN" || form.role === "LEADER") && !form.email) {
      alert("El correo es obligatorio para Administradores y Líderes");
      return;
    }

    setSaving(true);
    try {
      const dataToSave: any = {
        name: form.name,
        role: form.role,
        hourlyRate: parseFloat(form.hourlyRate) || 0,
        updatedAt: new Date().toISOString(),
      };

      if (form.role === "COLLABORATOR") {
        dataToSave.specialty = form.specialty;
        dataToSave.email = ""; // Limpiar correo si se cambia a colaborador
      } else {
        dataToSave.email = form.email;
        dataToSave.specialty = ""; // Limpiar especialidad
      }

      if (isEditing) {
        await updateDoc(doc(db, "users", initialData.id), dataToSave);
      } else {
        await addDoc(collection(db, "users"), {
            ...dataToSave,
            createdAt: new Date().toISOString(),
            isActive: true,
        });
      }

      setSaved(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch (error) {
      console.error("Error saving collaborator:", error);
      alert("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const isManagement = form.role === "ADMIN" || form.role === "LEADER";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in text-white">
      <div className="w-full max-w-lg rounded-3xl bg-[#1B2031] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl brand-gradient flex items-center justify-center shadow-lg shadow-orange-500/20">
              <UserPlus size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{isEditing ? "Editar Registro" : "Nuevo Registro"}</h2>
              <p className="text-[11px] text-white/30 font-black uppercase tracking-widest mt-0.5">Gestión de Personal MJR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-7 space-y-6">
          <div className="grid grid-cols-2 gap-5">
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                   <Shield size={12} className="text-[#F55B1F]" /> Tipo de Usuario
                </Label>
                <Select value={form.role} onValueChange={(v) => set("role", v)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1B2031] border-white/10 text-white">
                    <SelectItem value="COLLABORATOR">Colaborador (Taller)</SelectItem>
                    <SelectItem value="LEADER">Líder de Proyecto</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Nombre Completo</Label>
                <Input
                  required
                  placeholder="Ej: Marco Antonio Solís"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#F55B1F]"
                />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className={isManagement ? "space-y-2 col-span-2" : "space-y-2"}>
                {isManagement ? (
                  <>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                      <Mail size={12} className="text-[#F55B1F]" /> Correo Institucional
                    </Label>
                    <Input
                      required
                      type="email"
                      placeholder="correo@mjrestructuras.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#F55B1F]"
                    />
                  </>
                ) : (
                  <>
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                      <HardHat size={12} className="text-[#F55B1F]" /> Especialidad
                    </Label>
                    <Select value={form.specialty} onValueChange={(v) => set("specialty", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1B2031] border-white/10 text-white">
                        <SelectItem value="Soldador">Soldador</SelectItem>
                        <SelectItem value="Armador">Armador</SelectItem>
                        <SelectItem value="Cortador">Cortador</SelectItem>
                        <SelectItem value="Pintor">Pintor</SelectItem>
                        <SelectItem value="Ayudante">Ayudante</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
             </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1 flex items-center gap-2">
                   <DollarSign size={12} className="text-[#F55B1F]" /> Costo por Hora (₡)
                </Label>
                <Input
                  required
                  type="number"
                  placeholder="0.00"
                  value={form.hourlyRate}
                  onChange={(e) => set("hourlyRate", e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#F55B1F] font-mono font-bold"
                />
              </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-white/50 hover:bg-white/5 hover:text-white h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={saving || saved}
              className="flex-1 h-12 rounded-xl brand-gradient text-white text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-orange-500/25 hover:opacity-95 transition-all disabled:opacity-50"
            >
              {saved ? (
                <div className="flex items-center justify-center gap-2"><CheckCircle2 size={18} /> {isEditing ? "Actualizado" : "Guardado"}</div>
              ) : saving ? (
                <div className="flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> {isEditing ? "Actualizando" : "Guardando"}</div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                   {isEditing ? <><Save size={16} /> Actualizar Datos</> : "Guardar Registro"}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
