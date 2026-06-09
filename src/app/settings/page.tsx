"use client";

import React, { useState, useRef } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import { Moon, Sun, Monitor, Wrench, User, Trash2, LogOut, Loader2, Image, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { Equipment, Quality } from '@/lib/types';
import * as XLSX from 'xlsx';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { user, signOut } = useAuth();
  
  // Account Form States
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  
  // QR Settings States
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMessage, setLogoMessage] = useState({ type: '', text: '' });
  const [churchName, setChurchName] = useState(settings.churchName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ type: '', text: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Import / Export
  const [importExportMessage, setImportExportMessage] = useState({ type: '', text: '' });

  // Export
  const [exporting, setExporting] = useState(false);

  // Import
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [parsedColumns, setParsedColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importPreview, setImportPreview] = useState<{
    total: number;
    withControlNumber: number;
    withoutControlNumber: number;
  } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const equipFields = [
    { value: '', label: 'Skip column' },
    { value: 'control_number', label: 'Control Number' },
    { value: 'name', label: 'Name' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'quality', label: 'Quality' },
    { value: 'department', label: 'Department' },
    { value: 'location', label: 'Location' },
  ];

  const handleUpdateProfile = async () => {
    setAccountLoading(true);
    setAccountMessage({ type: '', text: '' });
    
    try {
      const updates: { email?: string; password?: string; data?: { username?: string; phone?: string } } = {};
      if (email !== user?.email) updates.email = email;
      if (password) updates.password = password;
      if (username !== user?.user_metadata?.username || phone !== user?.user_metadata?.phone) {
        updates.data = { username, phone };
      }

      if (Object.keys(updates).length === 0) {
        setAccountMessage({ type: 'info', text: 'No changes to save.' });
        return;
      }

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
      setAccountMessage({ type: 'success', text: 'Profile updated successfully! If you changed your email, please check your inbox for a confirmation link.' });
      setPassword(''); // Clear password after successful update
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile.';
      setAccountMessage({ type: 'error', text: message });
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setAccountLoading(true);
    setIsDeleteModalOpen(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/auth/delete', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account.');
      await signOut();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account. Note: Requires SUPABASE_SERVICE_ROLE_KEY to be set.';
      setAccountMessage({ type: 'error', text: message });
    } finally {
      setAccountLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setImportExportMessage({ type: '', text: '' });
    try {
      const equipment = await api.getEquipment();
      const data = equipment.map(e => ({
        name: e.name,
        department: e.department,
        location: e.location,
        quantity: e.quantity,
        quality: e.quality,
        control_number: e.control_number,
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Equipment');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `equipment-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setImportExportMessage({ type: 'success', text: `Exported ${data.length} equipment records.` });
    } catch (err) {
      console.error('Export failed:', err);
      setImportExportMessage({ type: 'error', text: 'Failed to export equipment.' });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportExportMessage({ type: '', text: '' });

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' });

        if (rows.length === 0) {
          setImportExportMessage({ type: 'error', text: 'The file contains no data.' });
          return;
        }

        const cols = Object.keys(rows[0]);
        setParsedColumns(cols);
        setParsedData(rows);

        // Auto-detect mapping
        const autoMapping: Record<string, string> = {};
        const lowerToField: Record<string, string> = {
          'control number': 'control_number',
          'control#': 'control_number',
          'control #': 'control_number',
          'controlno': 'control_number',
          'control_no': 'control_number',
          'controlnumber': 'control_number',
          'name': 'name',
          'item name': 'name',
          'item': 'name',
          'description': 'name',
          'quantity': 'quantity',
          'qty': 'quantity',
          'quality': 'quality',
          'condition': 'quality',
          'status': 'quality',
          'department': 'department',
          'dept': 'department',
          'location': 'location',
          'loc': 'location',
          'place': 'location',
        };
        for (const col of cols) {
          const key = col.toLowerCase().trim().replace(/\s+/g, ' ');
          if (lowerToField[key]) {
            autoMapping[col] = lowerToField[key];
          } else {
            autoMapping[col] = '';
          }
        }

        setColumnMapping(autoMapping);

        const withCN = rows.filter(r => {
          const cnCol = Object.entries(autoMapping).find(([, v]) => v === 'control_number')?.[0];
          return cnCol && r[cnCol]?.trim();
        }).length;
        setImportPreview({
          total: rows.length,
          withControlNumber: withCN,
          withoutControlNumber: rows.length - withCN,
        });
      } catch (err) {
        console.error('Parse failed:', err);
        setImportExportMessage({ type: 'error', text: 'Failed to parse file. Make sure it is a valid .xls, .xlsx, or .csv file.' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    setImportExportMessage({ type: '', text: '' });
    try {
      const cnCol = Object.entries(columnMapping).find(([, v]) => v === 'control_number')?.[0];
      const nameCol = Object.entries(columnMapping).find(([, v]) => v === 'name')?.[0];
      const qtyCol = Object.entries(columnMapping).find(([, v]) => v === 'quantity')?.[0];
      const qualityCol = Object.entries(columnMapping).find(([, v]) => v === 'quality')?.[0];
      const deptCol = Object.entries(columnMapping).find(([, v]) => v === 'department')?.[0];
      const locCol = Object.entries(columnMapping).find(([, v]) => v === 'location')?.[0];

      if (!nameCol) {
        setImportExportMessage({ type: 'error', text: 'Please map the "Name" column before importing.' });
        setImporting(false);
        return;
      }

      let count = await api.getEquipmentCount();
      let imported = 0;
      let errors = 0;

      for (const row of parsedData) {
        try {
          const controlNumber = (cnCol ? row[cnCol]?.trim() : '') || '';
          const name = row[nameCol]?.trim();
          if (!name) { errors++; continue; }

          const quantity = parseInt(qtyCol ? row[qtyCol] : '1', 10) || 1;
          const qualityRaw = (qualityCol ? row[qualityCol]?.trim() : '') || '';
          const validQualities: Quality[] = ['New', 'Good', 'Fair', 'Poor', 'Broken'];
          const quality = validQualities.includes(qualityRaw as Quality)
            ? (qualityRaw as Quality)
            : 'Good';
          const department = deptCol ? (row[deptCol]?.trim() || 'Uncategorized') : 'Uncategorized';
          const location = locCol ? (row[locCol]?.trim() || 'Unspecified') : 'Unspecified';

          const finalControlNumber = controlNumber || generateControlNumber(count + 1);

          await api.createEquipment({
            control_number: finalControlNumber,
            name,
            quantity,
            quality,
            department,
            location,
          });
          count++;
          imported++;
        } catch (rowErr) {
          console.error('Failed to import row:', rowErr);
          errors++;
        }
      }

      setImportExportMessage({
        type: 'success',
        text: `Imported ${imported} equipment record${imported !== 1 ? 's' : ''}.${errors > 0 ? ` ${errors} row${errors !== 1 ? 's' : ''} skipped due to errors.` : ''}`,
      });
      setImportFile(null);
      setParsedData([]);
      setParsedColumns([]);
      setColumnMapping({});
      setImportPreview(null);
      if (importFileRef.current) importFileRef.current.value = '';
    } catch (err) {
      console.error('Import failed:', err);
      setImportExportMessage({ type: 'error', text: 'Import failed. Check console for details.' });
    } finally {
      setImporting(false);
    }
  };

  function generateControlNumber(seq: number) {
    const d = new Date();
    const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `${yyyymmdd}-${seq}`;
  }

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 md:mb-8">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Appearance</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Theme Preference</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-all ${
                settings.theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
              }`}
            >
              <Sun className="w-4 h-4" /> Light
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-all ${
                settings.theme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
              }`}
            >
              <Moon className="w-4 h-4" /> Dark
            </button>
            <button
              onClick={() => updateSettings({ theme: 'system' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-all ${
                settings.theme === 'system' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
              }`}
            >
              <Monitor className="w-4 h-4" /> System
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5" /> Account Management
        </h2>
        
        {accountMessage.text && (
          <div className={`p-4 rounded-lg mb-6 text-sm ${
            accountMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400' :
            accountMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' :
            'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400'
          }`}>
            {accountMessage.text}
          </div>
        )}

        <div className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Email Address" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <Input 
              label="New Password" 
              type="password" 
              placeholder="Leave blank to keep current" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Username" 
              type="text" 
              placeholder="CoolUser123" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
            />
            <Input 
              label="Phone Number" 
              type="tel" 
              placeholder="+1234567890" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Button onClick={handleUpdateProfile} disabled={accountLoading} className="flex items-center gap-2">
              {accountLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Profile Changes
            </Button>
            <Button onClick={() => signOut()} variant="secondary" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Permanently delete your account. This action cannot be undone.
            </p>
            <Button onClick={() => setIsDeleteModalOpen(true)} variant="danger" disabled={accountLoading} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* QR Code Settings */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Image className="w-5 h-5" /> QR Code Settings
        </h2>

        {logoMessage.text && (
          <div className={`p-4 rounded-lg mb-6 text-sm ${
            logoMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400' :
            logoMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' :
            'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400'
          }`}>
            {logoMessage.text}
          </div>
        )}

        <div className="space-y-6 max-w-xl">
          {/* Church Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Church Logo
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Upload your church logo to be displayed in the center of generated QR codes.
            </p>
            <div className="flex items-start gap-4">
              {settings.logoUrl ? (
                <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0 bg-white">
                  <img
                    src={settings.logoUrl}
                    alt="Church Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center flex-shrink-0 bg-gray-50 dark:bg-gray-700">
                  <Image className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setLogoUploading(true);
                    setLogoMessage({ type: '', text: '' });
                    try {
                      await api.uploadLogo(file);
                      const url = await api.getLogoUrl();
                      updateSettings({ logoUrl: url });
                      setLogoMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                    } catch (err) {
                      console.error('Failed to upload logo:', err);
                      setLogoMessage({
                        type: 'error',
                        text: `Failed to upload logo. Make sure the "logos" bucket has INSERT and UPDATE policies for authenticated users (Supabase Dashboard → Storage → logos → Policies).`,
                      });
                    } finally {
                      setLogoUploading(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-2"
                >
                  {logoUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {settings.logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateSettings({ logoUrl: '' });
                      setLogoMessage({ type: 'info', text: 'Logo removed.' });
                    }}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Church Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Church Name / Footer Text
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              This text will appear below each QR code and on printed labels.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="e.g. Property of UCCP Sukat Evangelical Church"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  updateSettings({ churchName });
                  setLogoMessage({ type: 'success', text: 'Church name updated!' });
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Import / Export */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" /> Import / Export Equipment
        </h2>

        {importExportMessage.text && (
          <div className={`p-4 rounded-lg mb-6 text-sm ${
            importExportMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-400' :
            importExportMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-400' :
            'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-400'
          }`}>
            {importExportMessage.text}
          </div>
        )}

        <div className="space-y-6 max-w-2xl">
          {/* Export */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Download all equipment records as an Excel (.xlsx) file.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* Import */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Import</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Upload an .xls, .xlsx, or .csv file. Map the columns to equipment fields, then import.
            </p>

            <input
              ref={importFileRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!parsedData.length ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => importFileRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload File
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    File: <span className="font-medium text-gray-900 dark:text-white">{importFile?.name}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setImportFile(null);
                      setParsedData([]);
                      setParsedColumns([]);
                      setColumnMapping({});
                      setImportPreview(null);
                      if (importFileRef.current) importFileRef.current.value = '';
                    }}
                  >
                    Remove
                  </Button>
                </div>

                {/* Column Mapping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Column Mapping
                  </label>
                  <div className="space-y-2">
                    {parsedColumns.map((col) => (
                      <div key={col} className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-40 truncate flex-shrink-0">
                          {col}
                        </span>
                        <select
                          value={columnMapping[col] || ''}
                          onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                          className="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {equipFields.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {importPreview && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Total rows: <strong className="text-gray-900 dark:text-white">{importPreview.total}</strong>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        With control number: <strong className="text-gray-900 dark:text-white">{importPreview.withControlNumber}</strong>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Without control number: <strong className="text-amber-600 dark:text-amber-400">{importPreview.withoutControlNumber}</strong>
                      </span>
                    </div>
                    {importPreview.withoutControlNumber > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Rows without a control number will be auto-generated in the format YYYYMMDD-N.
                      </p>
                    )}
                  </div>
                )}

                {/* Data Preview Table */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preview ({Math.min(parsedData.length, 5)} of {parsedData.length} rows)
                  </label>
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          {parsedColumns.map((col) => (
                            <th key={col} className="px-3 py-2 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {parsedData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            {parsedColumns.map((col) => (
                              <td key={col} className="px-3 py-2 max-w-[200px] truncate">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setImportFile(null);
                      setParsedData([]);
                      setParsedColumns([]);
                      setColumnMapping({});
                      setImportPreview(null);
                      if (importFileRef.current) importFileRef.current.value = '';
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-2"
                  >
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {importing ? 'Importing...' : `Import ${parsedData.length} Record${parsedData.length !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Developer Tools</h2>
        
        <div className="flex justify-between items-start sm:items-center gap-4 py-2">
          <div className="flex-1 pr-2 sm:pr-0">
            <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-gray-500 dark:text-gray-400" /> Show Next.js Dev Tools
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Toggle the floating Next.js development tools and build indicators at the bottom of the screen.
            </p>
          </div>
          
          <button 
            onClick={() => updateSettings({ devToolsEnabled: !settings.devToolsEnabled })}
            className={`flex-shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
              settings.devToolsEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span 
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.devToolsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            WARNING: Are you absolutely sure you want to delete your account? This action cannot be undone. 
            All of your authentication data will be permanently removed.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={handleDeleteAccount}>Yes, Delete Account</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
