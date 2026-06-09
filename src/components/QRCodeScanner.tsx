"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Loader2, Camera, CameraOff } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (controlNumber: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function QRCodeScanner({ onScan, onClose, isOpen }: QRCodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-scanner-container';

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setInitializing(true);
    setError(null);

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            if (mounted) {
              scanner.stop().catch(() => {});
              onScan(decodedText);
            }
          },
          () => {}
        );

        if (mounted) {
          setScanning(true);
          setInitializing(false);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to access camera. Please ensure camera permissions are granted.'
          );
          setInitializing(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan QR Code
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          {initializing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-400">Initializing camera...</p>
            </div>
          )}

          {error && !initializing && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CameraOff className="w-10 h-10 text-red-400" />
              <p className="text-sm text-red-400 text-center">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          <div
            id={containerId}
            className={initializing || error ? 'hidden' : 'w-full'}
          />

          {scanning && !error && (
            <p className="text-center text-sm text-gray-400 mt-3">
              Point your camera at a QR code
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
