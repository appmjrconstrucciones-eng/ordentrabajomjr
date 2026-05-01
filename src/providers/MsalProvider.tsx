"use client";

import { MsalProvider as Provider } from "@azure/msal-react";
import { msalInstance } from "@/lib/microsoft/authConfig";

export function MsalProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider instance={msalInstance}>
      {children}
    </Provider>
  );
}
