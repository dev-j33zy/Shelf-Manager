"use client";

import React, { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';
import { useSettings } from './SettingsProvider';

interface QRCodeProps {
  controlNumber: string;
  size?: number;
  showLogo?: boolean;
  showText?: boolean;
  colorMode?: 'color' | 'monotone';
  theme?: 'light' | 'dark';
  className?: string;
}

export function QRCode({
  controlNumber,
  size = 200,
  showLogo = true,
  showText = true,
  colorMode = 'color',
  theme,
  className,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useSettings();
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLImageElement | null>(null);

  const effectiveTheme = theme || settings.theme;
  const isDark = effectiveTheme === 'dark';
  const darkColor = colorMode === 'monotone' ? '#000000' : (isDark ? '#ffffff' : '#000000');
  const lightColor = colorMode === 'monotone' ? '#ffffff' : (isDark ? '#1f2937' : '#ffffff');

  useEffect(() => {
    if (!canvasRef.current || !controlNumber) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    QRCodeLib.toCanvas(
      canvas,
      controlNumber,
      {
        width: size,
        margin: 2,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      },
      function (error) {
        if (error) {
          console.error('QR Code generation error:', error);
          return;
        }

        if (showLogo && logoRef.current && logoRef.current.complete && logoRef.current.naturalWidth > 0) {
          const logoSize = size * 0.2;
          const logoX = (size - logoSize) / 2;
          const logoY = (size - logoSize) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 2, 0, Math.PI * 2);
          ctx.fillStyle = lightColor;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoRef.current, logoX, logoY, logoSize, logoSize);
          ctx.restore();
        }
      }
    );
  }, [controlNumber, size, darkColor, lightColor, showLogo]);

  useEffect(() => {
    if (!showLogo || !settings.logoUrl) {
      setLogoLoaded(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoRef.current = img;
      setLogoLoaded(true);
    };
    img.onerror = () => {
      setLogoLoaded(true);
    };
    img.src = settings.logoUrl;
  }, [showLogo, settings.logoUrl]);

  return (
    <div className={`inline-flex flex-col items-center ${className || ''}`}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg"
        style={{ width: size, height: size }}
      />
      {showText && settings.churchName && (
        <p
          className={`mt-2 text-center text-xs font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          style={{ maxWidth: size + 20 }}
        >
          {settings.churchName}
        </p>
      )}
    </div>
  );
}
