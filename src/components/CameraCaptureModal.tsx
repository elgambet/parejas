"use client";

import { useRef } from "react";
import { Camera } from "react-camera-pro";

type CameraCaptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

type CameraHandle = {
  takePhoto: () => string;
  switchCamera: () => void;
};

const cameraErrorMessages = {
  noCameraAccessible: "No se pudo acceder a la camara.",
  permissionDenied: "No diste permiso para usar la camara.",
  switchCamera: "No se pudo cambiar la camara.",
  canvas: "No se pudo capturar la imagen.",
};

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const cameraRef = useRef<CameraHandle | null>(null);

  if (!isOpen) return null;

  const handleCapture = () => {
    const dataUrl = cameraRef.current?.takePhoto();
    if (!dataUrl) {
      return;
    }
    onCapture(dataUrl);
  };

  const handleSwitchCamera = () => {
    cameraRef.current?.switchCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-4">
        <p className="mb-3 text-center text-sm text-neutral-700">
          Alinea la foto y captura
        </p>
        <div className="relative overflow-hidden rounded-xl">
          <Camera
            ref={cameraRef}
            facingMode="environment"
            aspectRatio={4 / 3}
            errorMessages={cameraErrorMessages}
          />
          <button
            type="button"
            aria-label="Cambiar camara"
            title="Cambiar camara"
            className="absolute right-3 top-3 z-20 rounded-full bg-black/70 p-2 text-white backdrop-blur-sm"
            onClick={handleSwitchCamera}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-full bg-black px-4 py-2 text-sm text-white"
            onClick={handleCapture}
          >
            Capturar
          </button>
        </div>
      </div>
    </div>
  );
}
