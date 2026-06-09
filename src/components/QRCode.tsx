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
          const cornerRadius = 4;

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4, cornerRadius + 2);
          ctx.fillStyle = lightColor;
          ctx.fill();
          ctx.beginPath();
          ctx.roundRect(logoX, logoY, logoSize, logoSize, cornerRadius);
          ctx.clip();

          if (colorMode === 'monotone' && settings.logoIsSvg) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = logoSize;
            tempCanvas.height = logoSize;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.drawImage(logoRef.current, 0, 0, logoSize, logoSize);
              tempCtx.globalCompositeOperation = 'source-in';
              tempCtx.fillStyle = darkColor;
              tempCtx.fillRect(0, 0, logoSize, logoSize);
              ctx.drawImage(tempCanvas, logoX, logoY);
            }
          } else {
            ctx.drawImage(logoRef.current, logoX, logoY, logoSize, logoSize);
          }
          ctx.restore();
        }
      }
    );
  }, [controlNumber, size, darkColor, lightColor, showLogo, logoLoaded]);

  useEffect(() => {
    if (!showLogo || !settings.logoUrl) {
      setLogoLoaded(true);
      return;
    }

    const img = new Image();
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
