"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardHat, LogIn, Loader2, AlertCircle, Key } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

export default function LoginPage() {
  const { simulateUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkUserRole = async (userEmail: string) => {
    const q = query(collection(db, "users"), where("email", "==", userEmail));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("Acceso denegado. Tu correo no está registrado en el sistema MJR.");
    }
    const userData = snap.docs[0].data();
    if (userData.role !== "ADMIN" && userData.role !== "LEADER") {
      throw new Error("No tienes permisos suficientes para acceder a la plataforma.");
    }
    return userData;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email) {
        await checkUserRole(result.user.email);
        router.push("/admin");
      }
    } catch (err: any) {
      setError(err.message);
      await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await checkUserRole(email);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    simulateUser("ADMIN", "dev@mjrestructuras.com", "Desarrollador MJR");
    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl brand-gradient flex items-center justify-center shadow-xl shadow-orange-500/20">
            <HardHat size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">MJR Estructuras</h1>
            <p className="text-xs text-[#F55B1F] font-bold uppercase tracking-[0.3em] mt-1">Plataforma Operativa OT</p>
          </div>
        </div>

        <div className="bg-[#1B2031] border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Bienvenido</h2>
            <p className="text-sm text-white/30">Inicia sesión con tus credenciales autorizadas</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Correo Electrónico</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@mjrestructuras.com"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#F55B1F]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Contraseña</Label>
              <Input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-[#F55B1F]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full brand-gradient text-white h-12 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Entrar al Taller</>}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black text-white/20"><span className="bg-[#1B2031] px-4">O accede con</span></div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-white/10 bg-white/5 text-white h-12 rounded-xl font-bold hover:bg-white/10"
          >
            <Key className="mr-2 h-4 w-4" /> Google / Microsoft
          </Button>

          {/* Dev Bypass (Solo visible en Localhost) */}
          {mounted && window.location.hostname === "localhost" && (
            <div className="pt-2 border-t border-white/5">
               <button 
                onClick={handleDevBypass}
                className="w-full py-2 px-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#F55B1F] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-500/20 transition-all italic"
               >
                 🛠️ Saltar Login (Modo Desarrollador)
               </button>
               <p className="text-[9px] text-white/20 text-center mt-2">Usa esto para entrar y luego el panel de simulación (abajo derecha)</p>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-white/20 uppercase font-bold tracking-widest leading-loose">
          Acceso restringido a personal calificado<br/>MJR Estructuras Metálicas © 2024
        </p>
      </div>
    </div>
  );
}
