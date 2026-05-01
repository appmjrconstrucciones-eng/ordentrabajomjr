import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ── PROYECTO ACTUAL (Órdenes de Trabajo) ──
// Aquí se guardarán las OTs, Colaboradores, Tiempos, etc.
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// ── PROYECTO DE REFERENCIA (Seguimiento de Proyectos) ──
// De aquí leeremos únicamente los "contracts" (Proyectos Maestros)
const referenceConfig = {
  apiKey:            "AIzaSyAjCd_CKlUL0RCfn4jjdYwMDtEbY7vTetA",
  authDomain:        "segproy-app.firebaseapp.com",
  projectId:         "segproy-app",
  storageBucket:     "segproy-app.firebasestorage.app",
  messagingSenderId: "908880282094",
  appId:             "1:908880282094:web:9df1e05cf020cd8c0f4eff",
};

import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Inicialización
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const refApp = getApps().find(a => a.name === "reference") || initializeApp(referenceConfig, "reference");

export const db = getFirestore(app);
export const dbRef = getFirestore(refApp);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
