import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { User } from "firebase/auth";

import { db, storage } from "@/lib/firebase";

type CoupleRecord = {
  coupleName: string;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  updatedAt?: { toDate?: () => Date };
};

type ValidCoupleRecord = {
  coupleKey: string;
  coupleName: string;
};

type UseCoupleDataState = {
  coupleKey: string | null;
  displayCoupleName: string | null;
  imageUrl: string | null;
  updatedAt: Date | null;
  isValidCouple: boolean | null;
  status: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
  uploadImage: (file: File, user: User) => Promise<boolean>;
};

function readCoupleKeyParam(rawValue: string | null): string | null {
  if (!rawValue) return null;
  const decoded = decodeURIComponent(rawValue).trim().toLowerCase();
  return decoded.length ? decoded : null;
}

function extractDate(value: CoupleRecord["updatedAt"]): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return null;
}

function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer el tamaño de la imagen."));
    };

    image.src = objectUrl;
  });
}

export default function useCoupleData(): UseCoupleDataState {
  const searchParams = useSearchParams();
  const coupleKey = useMemo(
    () => readCoupleKeyParam(searchParams.get("couple")),
    [searchParams],
  );

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [isValidCouple, setIsValidCouple] = useState<boolean | null>(null);
  const [displayCoupleName, setDisplayCoupleName] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!coupleKey) {
      setStatus("error");
      setErrorMessage(null);
      setIsValidCouple(false);
      return;
    }

    let cancelled = false;

    const loadCoupleData = async () => {
      try {
        setStatus("loading");
        setErrorMessage(null);

        const directDoc = doc(db, "validCouples", coupleKey);
        const directSnapshot = await getDoc(directDoc);

        if (cancelled) return;

        let resolvedValid = false;

        if (directSnapshot.exists()) {
          const data = directSnapshot.data() as ValidCoupleRecord;
          resolvedValid = true;
          setIsValidCouple(true);
          setDisplayCoupleName(data.coupleName ?? coupleKey);
        } else {
          const listQuery = query(
            collection(db, "validCouples"),
            where("coupleKey", "==", coupleKey),
          );
          const listSnapshot = await getDocs(listQuery);
          if (cancelled) return;

          if (!listSnapshot.empty) {
            const data = listSnapshot.docs[0].data() as ValidCoupleRecord;
            resolvedValid = true;
            setIsValidCouple(true);
            setDisplayCoupleName(data.coupleName ?? coupleKey);
          } else {
            setIsValidCouple(false);
            setDisplayCoupleName(coupleKey);
          }
        }

        if (!cancelled && resolvedValid) {
          const docRef = doc(db, "couples", coupleKey);
          const snapshot = await getDoc(docRef);
          if (cancelled) return;

          if (snapshot.exists()) {
            const data = snapshot.data() as CoupleRecord;
            setImageUrl(data.imageUrl);
            setUpdatedAt(extractDate(data.updatedAt));
          } else {
            setImageUrl(null);
            setUpdatedAt(null);
          }
        } else {
          setImageUrl(null);
          setUpdatedAt(null);
        }

        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          "Hubo un problema al cargar la información. Intentalo de nuevo.",
        );
      }
    };

    loadCoupleData();

    return () => {
      cancelled = true;
    };
  }, [coupleKey]);

  const uploadImage = async (file: File, user: User): Promise<boolean> => {
    if (!coupleKey) return false;

    try {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Solo se permiten imágenes.");
        return false;
      }

      setErrorMessage(null);
      const dimensions = await getImageDimensions(file).catch(() => null);
      const storageRef = ref(storage, `couples/${coupleKey}/photo`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const docRef = doc(db, "couples", coupleKey);
      await setDoc(
        docRef,
        {
          coupleName: displayCoupleName ?? coupleKey,
          imageUrl: url,
          imageWidth: dimensions?.width ?? null,
          imageHeight: dimensions?.height ?? null,
          updatedBy: user.uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setImageUrl(url);
      setUpdatedAt(new Date());
      setStatus("ready");
      return true;
    } catch (error) {
      setStatus("error");
      setErrorMessage("No se pudo subir la foto. Intentalo de nuevo.");
      return false;
    }
  };

  return {
    coupleKey,
    displayCoupleName,
    imageUrl,
    updatedAt,
    isValidCouple,
    status,
    errorMessage,
    uploadImage,
  };
}
