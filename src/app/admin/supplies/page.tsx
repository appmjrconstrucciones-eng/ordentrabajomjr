"use client";

import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Package, Search, Plus, Edit2, Trash2, Loader2, CheckCircle2, X 
} from "lucide-react";
import { useState } from "react";
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

interface Insumo {
  id: string;
  name: string;
  cost: number;
}

export default function SuppliesPage() {
  const { data: supplies, loading } = useFirestoreCollection<Insumo>("supplies", [], db);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenForm = (insumo?: Insumo) => {
    if (insumo) {
      setEditingInsumo(insumo);
      setName(insumo.name);
      setCost(String(insumo.cost));
    } else {
      setEditingInsumo(null);
      setName("");
      setCost("");
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cost || isSaving) return;

    setIsSaving(true);
    try {
      if (editingInsumo) {
        await updateDoc(doc(db, "supplies", editingInsumo.id), {
          name,
          cost: parseFloat(cost)
        });
      } else {
        await addDoc(collection(db, "supplies"), {
          name,
          cost: parseFloat(cost),
          createdAt: new Date().toISOString()
        });
      }
      setShowForm(false);
    } catch (error) {
      console.error("Error saving supply:", error);
      alert("Error al guardar el insumo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el insumo "${name}"?`)) {
      try {
        await deleteDoc(doc(db, "supplies", id));
      } catch (err) {
        alert("Error al eliminar el insumo");
      }
    }
  };

  const filteredSupplies = supplies.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Maestro de Insumos</h1>
          <p className="text-sm text-white/35 mt-0.5">Gestión de materiales y costos operativos base</p>
        </div>
        <Button 
          onClick={() => handleOpenForm()}
          className="brand-gradient text-white shadow-lg shadow-orange-500/25 font-bold h-10 px-6 rounded-xl transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Insumo
        </Button>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#1B2031] shadow-2xl overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar insumo por nombre..." 
              className="bg-white/5 border-white/10 pl-10 h-10 rounded-xl text-sm focus-visible:ring-[#F55B1F] text-white"
            />
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
             {filteredSupplies.length} Materiales en Inventario
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-white/10">
                <Loader2 className="animate-spin" size={32} />
             </div>
          ) : filteredSupplies.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 text-white/5 space-y-4">
                <Package size={48} opacity={0.5} />
                <p className="text-sm font-bold uppercase tracking-widest">No hay insumos que coincidan</p>
             </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                  <th className="px-6 py-4 text-left">Referencia de Material</th>
                  <th className="px-6 py-4 text-left">Costo Base (₡)</th>
                  <th className="px-6 py-4 text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSupplies.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                          <Package size={18} className="text-white/20 group-hover:text-[#F55B1F] transition-colors" />
                        </div>
                        <span className="font-bold text-white tracking-tight text-base uppercase">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-emerald-400 font-mono font-black text-base italic">
                        ₡{s.cost.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenForm(s)}
                            className="h-9 w-9 rounded-lg hover:bg-blue-500/10 text-white hover:text-blue-400 transition-all flex items-center justify-center"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(s.id, s.name)}
                            className="h-9 w-9 rounded-lg hover:bg-red-500/10 text-white hover:text-red-400 transition-all flex items-center justify-center"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-[2.5rem] bg-[#1B2031] border border-white/10 shadow-2xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl brand-gradient flex items-center justify-center shadow-lg">
                    <Package size={24} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-white">{editingInsumo ? "Editar" : "Nuevo"} Insumo</h2>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-0.5">Catálogo Maestro MJR</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowForm(false)}
                className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Nombre del Material</Label>
                <Input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Disco de Corte 4.5\"
                  className="bg-white/5 border-white/10 text-white h-12 rounded-2xl focus:ring-[#F55B1F]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Costo por Unidad (₡)</Label>
                <div className="relative">
                  <Input 
                    required
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0.00"
                    className="bg-white/5 border-white/10 text-white h-12 rounded-2xl pl-10 font-mono font-bold"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">₡</span>
                </div>
              </div>
              
              <div className="pt-4 flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-white/10 bg-white/5 text-white/50 h-14 rounded-2xl font-bold uppercase tracking-widest text-xs"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 brand-gradient text-white font-black uppercase tracking-widest text-xs h-14 rounded-2xl shadow-lg shadow-orange-500/20"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : editingInsumo ? "Actualizar" : "Crear Insumo"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
