import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { MsalProvider } from "@/providers/MsalProvider";
import { AuthProvider } from "@/providers/AuthProvider";

export const metadata: Metadata = {
  title: "OT Manager | MJR Estructuras Metálicas",
  description: "Plataforma de gestión operativa de Órdenes de Trabajo para taller de manufactura",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${geistMono.variable} h-full dark`}
    >
      <body className="h-full bg-background text-foreground overflow-hidden">
        <AuthProvider>
          <MsalProvider>
            {children}
          </MsalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
