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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerId] = useState(() => 'qr-scanner-' + Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setInitializing(true);
    setError(null);
    setScanning(false);

    const startScanner = async () => {
      try {
        // Ensure container is in the DOM before starting
        await new Promise(resolve => setTimeout(resolve, 100));

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
  }, [isOpen, onScan, containerId]);

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

        <div className="relative">
          {/* Scanner container - always visible when open */}
          <div
            id={containerId}
            ref={containerRef}
            className="w-full"
          />

          {/* Loading overlay */}
          {initializing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 z-10 min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-300 mt-3">Initializing camera...</p>
            </div>
          )}

          {/* Error state */}
          {error && !initializing && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 min-h-[300px]">
              <CameraOff className="w-10 h-10 text-red-400" />
              <p className="text-sm text-red-400 text-center px-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {scanning && !error && (
          <div className="px-4 pb-4">
            <p className="text-center text-sm text-gray-400">
              Point your camera at a QR code
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
