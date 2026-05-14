"use client";

import { MsalProvider as Provider } from "@azure/msal-react";
import { msalInstance } from "@/lib/microsoft/authConfig";

import { useEffect, useState } from "react";

export function MsalProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await msalInstance.initialize();
        // Procesa el resultado de una redirección si existe
        await msalInstance.handleRedirectPromise();
        setInitialized(true);
      } catch (e) {
        console.error("MSAL Init Error:", e);
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
