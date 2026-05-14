"use client";

import { MsalProvider as Provider } from "@azure/msal-react";
import { msalInstance } from "@/lib/microsoft/authConfig";

import { useEffect, useState } from "react";

export function MsalProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        console.log("[MSAL] Inicializando instancia...");
        await msalInstance.initialize();
        
        console.log("[MSAL] Procesando respuesta de redirección...");
        const result = await msalInstance.handleRedirectPromise();
        
        if (result) {
          console.log("[MSAL] ¡Redirección procesada con éxito!", result.account?.username);
        } else {
          console.log("[MSAL] No hay respuesta de redirección pendiente.");
        }
        
        setInitialized(true);
      } catch (e) {
        console.error("[MSAL] Error crítico en inicialización:", e);
        setInitialized(true); // Permitir que la app cargue aunque falle MSAL
      }
    };
    init();
  }, []);

  if (!initialized) return null;

  return (
    <Provider instance={msalInstance}>
      {children}
    </Provider>
  );
}
