"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { QRCode } from './QRCode';
import QRCodeLib from 'qrcode';
import { useSettings } from './SettingsProvider';

interface PrintItem {
  controlNumber: string;
  name: string;
}

interface QRCodePrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: PrintItem[];
}

type GridSize = 1 | 2 | 3 | 4;
type ColorMode = 'color' | 'monotone';
type PrintTheme = 'light' | 'dark';

function overlayLogoOnDataUrl(
  qrDataUrl: string,
  logoUrl: string,
  qrSize: number,
  colorMode: ColorMode,
  logoIsSvg: boolean
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = qrSize;
      canvas.height = qrSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(qrDataUrl); return; }

      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.onload = () => {
        ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);

        const logoSize = qrSize * 0.2;
        const logoX = (qrSize - logoSize) / 2;
        const logoY = (qrSize - logoSize) / 2;
        const cornerRadius = 4;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX - 2, logoY - 2, logoSize + 4, logoSize + 4, cornerRadius + 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, cornerRadius);
        ctx.clip();

        if (colorMode === 'monotone' && logoIsSvg) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = logoSize;
          tempCanvas.height = logoSize;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, logoSize, logoSize);
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillStyle = '#000000';
            tempCtx.fillRect(0, 0, logoSize, logoSize);
            ctx.drawImage(tempCanvas, logoX, logoY);
          }
        } else {
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
        }
        ctx.restore();

        resolve(canvas.toDataURL());
      };
      qrImg.onerror = () => resolve(qrDataUrl);
      qrImg.src = qrDataUrl;
    };
    img.onerror = () => resolve(qrDataUrl);
    img.src = logoUrl;
  });
}

export function QRCodePrintDialog({ isOpen, onClose, items }: QRCodePrintDialogProps) {
  const [gridSize, setGridSize] = useState<GridSize>(2);
  const [colorMode, setColorMode] = useState<ColorMode>('color');
  const [printTheme, setPrintTheme] = useState<PrintTheme>('light');
  const [showLogo, setShowLogo] = useState(true);
  const [showText, setShowText] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  const qrSize = gridSize === 1 ? 250 : gridSize === 2 ? 200 : gridSize === 3 ? 150 : 120;

  const generateDataUrls = useCallback(async () => {
    const darkColor = colorMode === 'monotone' ? '#000000' : (printTheme === 'dark' ? '#ffffff' : '#000000');
    const lightColor = colorMode === 'monotone' ? '#ffffff' : (printTheme === 'dark' ? '#1f2937' : '#ffffff');

    const urls = await Promise.all(
      items.map(async (item) => {
        const qrDataUrl = await QRCodeLib.toDataURL(item.controlNumber, {
          width: qrSize,
          margin: 2,
          color: { dark: darkColor, light: lightColor },
        });

        if (showLogo && settings.logoUrl) {
          const withLogo = await overlayLogoOnDataUrl(qrDataUrl, settings.logoUrl, qrSize, colorMode, settings.logoIsSvg);
          return { controlNumber: item.controlNumber, url: withLogo };
        }

        return { controlNumber: item.controlNumber, url: qrDataUrl };
      })
    );
    return urls;
  }, [items, qrSize, colorMode, printTheme, showLogo, settings.logoUrl]);

  const handlePrint = async () => {
    const dataUrls = await generateDataUrls();
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const bgColor = printTheme === 'dark' ? '#1f2937' : '#ffffff';
    const textColor = printTheme === 'dark' ? '#f3f4f6' : '#111827';
    const mutedColor = printTheme === 'dark' ? '#9ca3af' : '#6b7280';
    const borderColor = printTheme === 'dark' ? '#374151' : '#e5e7eb';

    const gridCols = gridSize === 1 ? 1 : gridSize === 2 ? 2 : gridSize === 3 ? 3 : 4;

    const itemsHtml = dataUrls.map((item) => `
      <div class="qr-item">
        <div class="qr-code-wrapper">
          <img src="${item.url}" width="${qrSize}" height="${qrSize}" alt="QR Code" />
        </div>
        <div class="qr-control-number">${item.controlNumber}</div>
        ${showText ? `<div class="qr-church-text">${settings.churchName || 'Property of UCCP Sukat Evangelical Church'}</div>` : ''}
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Codes</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: ${bgColor}; color: ${textColor}; font-family: Arial, sans-serif; padding: 20px; }
          @page { margin: 10mm; }
          .qr-grid {
            display: grid;
            grid-template-columns: repeat(${gridCols}, 1fr);
            gap: 16px;
            page-break-inside: avoid;
          }
          .qr-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px;
            border: 1px solid ${borderColor};
            border-radius: 8px;
            break-inside: avoid;
          }
          .qr-code-wrapper {
            width: ${qrSize}px;
            height: ${qrSize}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-code-wrapper img {
            display: block;
          }
          .qr-control-number {
            margin-top: 6px;
            font-size: 9px;
            font-family: monospace;
            color: ${mutedColor};
          }
          .qr-church-text {
            margin-top: 6px;
            font-size: 8px;
            text-align: center;
            color: ${mutedColor};
          }
          @media print {
            body { padding: 0; }
            .qr-item { border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <div class="qr-grid">
          ${itemsHtml}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print QR Codes">
      <div className="space-y-5">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure how your QR codes will be printed. Print {items.length} item{items.length !== 1 ? 's' : ''}.
        </p>

        {/* Preview */}
        <div
          ref={printRef}
          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex flex-wrap gap-3 justify-center"
        >
          {items.slice(0, 4).map((item) => (
            <div key={item.controlNumber} className="flex flex-col items-center">
              <QRCode
                controlNumber={item.controlNumber}
                size={80}
                showLogo={showLogo}
                showText={false}
                colorMode={colorMode}
                theme={printTheme}
              />
              <span className="text-[10px] text-gray-400 dark:text-gray-400 mt-1 font-mono truncate max-w-[80px] text-center">
                {item.controlNumber}
              </span>
            </div>
          ))}
          {items.length > 4 && (
            <div className="flex items-center justify-center w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">+{items.length - 4} more</span>
            </div>
          )}
        </div>

        {/* Grid Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Layout</label>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as GridSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`flex-1 px-3 py-2 rounded-md border text-sm transition-all ${
                  gridSize === size
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                {size}x{size}
              </button>
            ))}
          </div>
        </div>

        {/* Color Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
          <div className="flex gap-2">
            <button
              onClick={() => setColorMode('color')}
              className={`flex-1 px-3 py-2 rounded-md border text-sm transition-all ${
                colorMode === 'color'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              Colored
            </button>
            <button
              onClick={() => setColorMode('monotone')}
              className={`flex-1 px-3 py-2 rounded-md border text-sm transition-all ${
                colorMode === 'monotone'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              Monotone
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
          <div className="flex gap-2">
            <button
              onClick={() => setPrintTheme('light')}
              className={`flex-1 px-3 py-2 rounded-md border text-sm transition-all ${
                printTheme === 'light'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setPrintTheme('dark')}
              className={`flex-1 px-3 py-2 rounded-md border text-sm transition-all ${
                printTheme === 'dark'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show Logo
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showText}
              onChange={(e) => setShowText(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show Church Text
          </label>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={handlePrint} className="flex items-center gap-2">
            Print QR Codes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
