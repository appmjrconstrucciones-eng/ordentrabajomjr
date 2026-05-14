"use client";

import { useEffect } from "react";

export default function AuthBlankPage() {
  useEffect(() => {
    // Esta página debe estar vacía para que MSAL procese el login en el popup
    console.log("MSAL Redirect Page Loaded");
  }, []);

  return (
    <div style={{ 
      backgroundColor: "#111827", 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      color: "white",
      fontFamily: "sans-serif",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.2em"
    }}>
      Procesando autenticación...
    </div>
  );
}
