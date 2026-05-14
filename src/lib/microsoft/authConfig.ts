import { Configuration, PublicClientApplication } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: typeof window !== "undefined" ? window.location.origin : "https://ordentrabajomjr.vercel.app",
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`[MSAL] ${message}`);
      },
      logLevel: 3, // Nivel info para ver todo el proceso
    }
  }
};

// Aseguramos una instancia única (Singleton) para evitar problemas en Next.js
let msalInstance: PublicClientApplication;

if (typeof window !== "undefined") {
    msalInstance = new PublicClientApplication(msalConfig);
} else {
    // Instancia dummy para el servidor
    msalInstance = new PublicClientApplication(msalConfig);
}

export { msalInstance };

export const loginRequest = {
  scopes: ["User.Read", "Files.ReadWrite"],
};
