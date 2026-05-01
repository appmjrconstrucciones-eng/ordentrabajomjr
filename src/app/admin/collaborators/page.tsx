"use client";

import { useState } from "react";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { Button } from "@/components/ui/button";
import { 
    UserPlus, Search, MoreVertical, HardHat, Mail, Loader2, Users, 
    Edit2, Trash2, ShieldAlert, DollarSign 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NewCollaboratorForm } from "@/components/forms/NewCollaboratorForm";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function CollaboratorsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: users, loading } = useFirestoreCollection<any>("users", [], db);
  const { data: workOrders } = useFirestoreCollection<any>("work_orders", [], db);

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setShowForm(true);
  };

  const handleDelete = async (user: any) => {
    // 1. Verificar si el colaborador tiene sesiones ACTIVAS en alguna OT
    const isWorking = workOrders.some(ot => 
        ot.laborSessions?.some((s: any) => s.collabId === user.id && s.status === "ACTIVE")
    );

    if (isWorking) {
      alert(`No se puede eliminar a ${user.name} porque se encuentra trabajando activamente en una Orden de Trabajo.`);
      return;
    }

    if (confirm(`¿Estás seguro de eliminar a ${user.name}? Esta acción no se puede deshacer.`)) {
      try {
        await deleteDoc(doc(db, "users", user.id));
      } catch (err) {
        alert("Error al eliminar el colaborador");
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-7">
      {showForm && (
        <NewCollaboratorForm 
          initialData={selectedUser}
          onClose={() => {
            setShowForm(false);
            setSelectedUser(null);
          }} 
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestión de Personal</h1>
          <p className="text-sm text-white/35 mt-0.5">Control de acceso, roles y tarifas operativas</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="brand-gradient text-white shadow-lg shadow-orange-500/25 hover:opacity-90 font-bold h-10 px-6 rounded-xl transition-all"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Registrar Personal
        </Button>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#1B2031] shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <Input 
              placeholder="Buscar por nombre, correo o rol..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border-white/10 pl-10 h-10 rounded-xl text-sm focus-visible:ring-[#F55B1F] text-white"
            />
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
             <span>{filteredUsers.length} Usuarios Registrados</span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading ? (
             <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-white/20">
                <Loader2 className="animate-spin" size={32} />
             </div>
          ) : filteredUsers.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 text-white/10 space-y-4">
                <Users size={48} opacity={0.5} />
                <p className="text-sm font-bold uppercase tracking-widest">No se encontraron resultados</p>
             </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-black/20 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                  <th className="px-6 py-4 text-left">Ficha Técnica</th>
                  <th className="px-6 py-4 text-left">Acceso / Tarifa</th>
                  <th className="px-6 py-4 text-left">Rol / Especialidad</th>
                  <th className="px-6 py-4 text-right px-10">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black shadow-lg ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'brand-gradient text-white shadow-orange-500/10'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white tracking-tight text-base leading-tight">{u.name}</p>
                          <p className="text-[10px] text-white/20 font-mono mt-0.5 uppercase tracking-tighter">ID: {u.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {u.role !== "COLLABORATOR" ? (
                            <div className="flex items-center gap-2 text-white/60">
                                <Mail size={12} className="text-[#F55B1F]" />
                                <span className="font-bold text-xs">{u.email}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <DollarSign size={12} />
                                <span className="font-black text-xs font-mono italic">₡{u.hourlyRate?.toLocaleString()}/h</span>
                            </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded w-fit ${u.role === 'LEADER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                           {u.role}
                        </span>
                        {u.role === "COLLABORATOR" && (
                             <span className="text-[10px] text-white/30 font-bold uppercase flex items-center gap-1 ml-1">
                                <HardHat size={11} className="text-[#F55B1F]/30" /> {u.specialty}
                             </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <DropdownMenu>
                         <DropdownMenuTrigger className="h-9 w-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-white/20 hover:text-[#F55B1F] transition-all outline-none">
                            <MoreVertical size={16} />
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="bg-[#1B2031] border-white/10 text-white min-w-[150px] rounded-2xl p-1 shadow-2xl">
                            <DropdownMenuItem onClick={() => handleEdit(u)} className="flex items-center gap-2 p-3 hover:bg-white/5 focus:bg-white/5 cursor-pointer rounded-xl text-xs font-bold transition-colors">
                                <Edit2 size={14} className="text-blue-400" /> Editar Perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(u)} className="flex items-center gap-2 p-3 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer rounded-xl text-xs font-bold text-red-400 transition-colors">
                                <Trash2 size={14} /> Eliminar
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
