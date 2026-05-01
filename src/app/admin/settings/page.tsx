import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Database, Layout, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
        <p className="text-sm text-white/35 mt-0.5">Gestión de parámetros globales y conectividad</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Firebase Config Card */}
        <Card className="bg-[#1B2031] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-white">
              <Database className="text-[#F55B1F]" size={18} /> Base de Datos (Firebase)
            </CardTitle>
            <CardDescription className="text-white/30 text-xs">Información de la instancia conectada</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                <span className="text-white/40">Project ID</span>
                <span className="font-mono text-[11px] text-[#F55B1F] bg-[#F55B1F]/10 px-2 py-0.5 rounded">
                  {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm py-2 border-b border-white/5">
                <span className="text-white/40">Región</span>
                <span className="text-white/60 font-medium italic">us-central (auto)</span>
              </div>
              <div className="flex justify-between items-center text-sm py-2">
                <span className="text-white/40">Estado de Conexión</span>
                <span className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Conectado
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full border-white/10 text-white/40 hover:bg-white/5 hover:text-white h-10 rounded-xl text-xs font-bold">
              Verificar Credenciales
            </Button>
          </CardContent>
        </Card>

        {/* Roles and Security */}
        <Card className="bg-[#1B2031] border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-white">
              <Shield className="text-[#F55B1F]" size={18} /> Seguridad y Roles
            </CardTitle>
            <CardDescription className="text-white/30 text-xs">Niveles de acceso y permisos RBAC</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 pb-2">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Admims</p>
                <p className="text-xl font-bold text-white mt-1">1</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Monitores</p>
                <p className="text-xl font-bold text-white mt-1">0</p>
              </div>
            </div>
            <Button className="w-full brand-gradient text-white h-10 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20">
              Gestionar Permisos
            </Button>
          </CardContent>
        </Card>

        {/* UI Customization */}
        <Card className="bg-[#1B2031] border-white/5 shadow-2xl rounded-3xl overflow-hidden opacity-50 pointer-events-none">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-white">
              <Layout className="text-[#F55B1F]" size={18} /> Personalización (Próximamente)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 text-center text-white/20 italic text-sm">
             Controles de apariencia y temas de planta.
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-[#1B2031] border-white/5 shadow-2xl rounded-3xl overflow-hidden opacity-50 pointer-events-none">
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-lg font-bold flex items-center gap-3 text-white">
              <Bell className="text-[#F55B1F]" size={18} /> Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-10 text-center text-white/20 italic text-sm">
             Alertas críticas de retraso en producción.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
