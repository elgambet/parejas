import { useState } from "react";
import { User } from "firebase/auth";

const FORCE_UPLOAD_SUCCESS = false;

type LoaderState = {
  showLoader: boolean;
  loaderText: string;
  uploading: boolean;
  handleFileChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<boolean>;
  handleFileUpload: (file: File) => Promise<boolean>;
};

type UseLoaderInput = {
  status: "idle" | "loading" | "ready" | "error";
  coupleKey: string | null;
  isValidCouple: boolean | null;
  user: User | null;
  uploadImage: (file: File, user: User) => Promise<boolean>;
};

export default function useLoader({
  status,
  coupleKey,
  isValidCouple,
  user,
  uploadImage,
}: UseLoaderInput): LoaderState {
  const [uploading, setUploading] = useState(false);

  const showLoader =
    uploading ||
    status === "loading" ||
    (!!coupleKey && isValidCouple === null);
  const loaderText = uploading ? "Subiendo foto..." : "Cargando...";

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return false;
    return handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    if (!file || !user || !isValidCouple) return false;

    if (FORCE_UPLOAD_SUCCESS) {
      return true;
    }

    setUploading(true);
    try {
      return await uploadImage(file, user);
    } finally {
      setUploading(false);
    }
  };

  return {
    showLoader,
    loaderText,
    uploading,
    handleFileChange,
    handleFileUpload,
  };
}
