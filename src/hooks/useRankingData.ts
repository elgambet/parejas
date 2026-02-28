import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type RankingEntry = {
  id: string;
  coupleName: string;
  imageUrl: string | null;
  updatedAt: Date | null;
};

type UseRankingDataState = {
  entries: RankingEntry[];
  loading: boolean;
  error: string | null;
};

function extractDate(value: { toDate?: () => Date } | undefined): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

export default function useRankingData(): UseRankingDataState {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        const rankingQuery = query(
          collection(db, "couples"),
          orderBy("updatedAt", "asc"),
        );
        const snapshot = await getDocs(rankingQuery);
        if (cancelled) return;

        const rows = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data() as {
              coupleName?: string;
              updatedAt?: { toDate?: () => Date };
              imageUrl?: string;
            };

            return {
              id: docSnapshot.id,
              coupleName: data.coupleName ?? docSnapshot.id,
              updatedAt: extractDate(data.updatedAt),
              imageUrl: data.imageUrl ?? null,
            };
          })
          .filter((entry) => entry.imageUrl !== null); // Only include couples with uploaded photos

        setEntries(rows);
      } catch (err) {
        if (cancelled) return;
        setError("No se pudo cargar el ranking.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRanking();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    entries,
    loading,
    error,
  };
}
