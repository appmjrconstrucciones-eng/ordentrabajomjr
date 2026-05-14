"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider, microsoftProvider, db } from "@/lib/firebase";
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
    const cleanEmail = userEmail.toLowerCase().trim();
    const q = query(collection(db, "users"), where("email", "==", cleanEmail));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      // Permitir que el creador entre con su correo aunque no esté en el dominio mjrestructuras
      // Pero si no es el dominio corporativo y no está en la BD, bloqueamos.
      if (!cleanEmail.endsWith("@mjrestructuras.com") && !cleanEmail.includes("tatan") && !cleanEmail.includes("dev")) {
        throw new Error("Acceso restringido: Solo se permiten correos corporativos @mjrestructuras.com");
      }
      throw new Error(`El correo ${cleanEmail} no está registrado en el sistema MJR.`);
    }
    
    const userData = snap.docs[0].data();
    if (userData.role !== "ADMIN" && userData.role !== "LEADER") {
      throw new Error("No tienes permisos suficientes para acceder a la plataforma.");
    }
    return userData;
  };

  const handleSocialLogin = async (provider: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user.email) {
        await checkUserRole(result.user.email);
        router.push("/admin");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/account-exists-with-different-credential") {
        setError("Ya existe una cuenta con este correo pero usando otro método de inicio de sesión.");
      } else {
        setError(err.message);
      }
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

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin(googleProvider)}
              disabled={loading}
              className="w-full border-white/10 bg-white/5 text-white h-12 rounded-xl font-bold hover:bg-white/10 flex items-center justify-center"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Ingresar con Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin(microsoftProvider)}
              disabled={loading}
              className="w-full border-white/10 bg-white/5 text-white h-12 rounded-xl font-bold hover:bg-white/10 flex items-center justify-center"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h11v11H0z" />
                <path fill="#f3f3f3" d="M12 0h11v11H12z" />
                <path fill="#f3f3f3" d="M0 12h11v11H0z" />
                <path fill="#f3f3f3" d="M12 12h11v11H12z" />
              </svg>
              Acceso @mjrestructuras.com
            </Button>
          </div>

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
