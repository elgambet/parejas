'use client';

import { useRef } from 'react';
import { Camera } from 'react-camera-pro';

type CameraCaptureModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
};

type CameraHandle = {
  takePhoto: () => string;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-4">
        <p className="mb-3 text-center text-sm text-neutral-700">Alinea la foto y captura</p>
        <div className="overflow-hidden rounded-xl">
          <Camera ref={cameraRef} facingMode="environment" aspectRatio={4 / 3} />
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
