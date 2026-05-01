"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Firestore } from "firebase/firestore";

/**
 * Hook genérico para escuchar en tiempo real cualquier colección de Firestore.
 */
export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  firestoreDb: Firestore = db
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData]       = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!collectionName) return;

    const ref = collection(firestoreDb, collectionName);
    const q   = query(ref, ...constraints);

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore] Error en ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return { data, loading, error };
}
