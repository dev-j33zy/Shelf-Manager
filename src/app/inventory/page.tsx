"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Equipment, Quality } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { QRCodePrintDialog } from '@/components/QRCodePrintDialog';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { Plus, Search, Loader2, Eye, Trash2, QrCode, Printer, Camera, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseControlNumber, formatUnitControlNumber } from '@/lib/qr-utils';

export default function Inventory() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const router = useRouter();

  // QR Scanner (normal mode)
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Bulk selection & print
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [itemToPrintSingle, setItemToPrintSingle] = useState<Equipment | null>(null);
  const [printByUnit, setPrintByUnit] = useState(false);

  const [controlNumberMode, setControlNumberMode] = useState<'manual' | 'auto'>('manual');

  const [formData, setFormData] = useState({
    control_number: '',
    name: '',
    quantity: 1,
    quality: 'New' as Quality,
    department: '',
    location: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEquipment();
      setEquipment(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred while fetching equipment.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleScan = async (controlNumber: string) => {
    setIsScannerOpen(false);
    setScanning(true);
    try {
      const { base } = parseControlNumber(controlNumber);
      const equipment = await api.getEquipmentByControlNumber(base);
      if (equipment) {
        router.push(`/inventory/${equipment.id}`);
      } else {
        alert(`No equipment found with control number: ${base}`);
      }
    } catch (err) {
      console.error('Failed to look up equipment:', err);
      alert('Failed to look up equipment.');
    } finally {
      setScanning(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (controlNumberMode === 'auto') {
        const today = new Date();
        const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const nextNumber = equipment.length + 1;
        payload.control_number = `${yyyymmdd}-${nextNumber}`;
      }
      await api.createEquipment(payload);
      setIsAddModalOpen(false);
      setControlNumberMode('manual');
      setFormData({
        control_number: '',
        name: '',
        quantity: 1,
        quality: 'New',
        department: '',
        location: ''
      });
      loadData();
    } catch (error) {
      console.error('Failed to create equipment:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to add equipment: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteEquipment(itemToDelete);
      setItemToDelete(null);
      loadData();
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to delete equipment: ${message}`);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelectedIds(next);
  };

  const handleBulkPrint = () => {
    setIsPrintDialogOpen(true);
  };

  const filtered = equipment.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.control_number.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const selectedItems = equipment
    .filter(e => selectedIds.has(e.id))
    .flatMap(e => printByUnit && e.quantity > 1
      ? Array.from({ length: e.quantity }, (_, i) => ({
          controlNumber: formatUnitControlNumber(e.control_number, i + 1, e.quantity),
          name: e.name,
        }))
      : [{ controlNumber: e.control_number, name: e.name }]
    );

  return (
    <div className="p-2 sm:p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsScannerOpen(true)}
            disabled={scanning}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" /> Scan QR
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Item
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          <input 
            type="text" 
            placeholder="Search by name, control number, or department..." 
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <label className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={printByUnit}
                  onChange={(e) => setPrintByUnit(e.target.checked)}
                  className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                <Layers className="w-3 h-3" />
                Print individual codes per unit
              </label>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBulkPrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print QR Codes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedIds(new Set());
                  setPrintByUnit(false);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {error ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/50">
            <p className="font-semibold mb-2">Database connection error</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">Did you run the SCHEMA.sql script in your Supabase SQL Editor?</p>
          </div>
        ) : loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Control No.</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Name</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Qty</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Quality</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium">Dept. & Location</th>
                  <th className="px-3 md:px-6 py-2.5 md:py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 font-mono text-xs text-gray-900 dark:text-gray-300">{item.control_number}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">{item.quantity}</td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${item.quality === 'New' || item.quality === 'Good' ? 'bg-green-100 text-green-700' : 
                          item.quality === 'Fair' || item.quality === 'Poor' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'}
                      `}>
                        {item.quality}
                      </span>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4">
                      <div>{item.department}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{item.location}</div>
                    </td>
                    <td className="px-3 md:px-6 py-3 md:py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setItemToPrintSingle(item);
                            setIsPrintDialogOpen(true);
                          }}
                          className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Print QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <Link href={`/inventory/${item.id}`} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setItemToDelete(item.id)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-900/30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      No equipment found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Equipment">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Control Number</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="controlNumberMode"
                  checked={controlNumberMode === 'manual'}
                  onChange={() => setControlNumberMode('manual')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Manual
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="controlNumberMode"
                  checked={controlNumberMode === 'auto'}
                  onChange={() => setControlNumberMode('auto')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Auto-generate
              </label>
            </div>
            {controlNumberMode === 'manual' ? (
              <Input
                required
                value={formData.control_number}
                onChange={e => setFormData({...formData, control_number: e.target.value})}
              />
            ) : (
              <div className="flex h-10 w-full items-center rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                {new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}{String(new Date().getDate()).padStart(2, '0')}-{equipment.length + 1}
              </div>
            )}
          </div>
          <Input 
            label="Name" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantity" 
              type="number" 
              min={0} 
              required 
              value={formData.quantity} 
              onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} 
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.quality}
                onChange={e => setFormData({...formData, quality: e.target.value as Quality})}
              >
                <option value="New">New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Broken">Broken</option>
              </select>
            </div>
          </div>
          <Input 
            label="Department" 
            required 
            value={formData.department} 
            onChange={e => setFormData({...formData, department: e.target.value})} 
          />
          <Input 
            label="Location" 
            required 
            value={formData.location} 
            onChange={e => setFormData({...formData, location: e.target.value})} 
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Delete Equipment">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Are you sure you want to delete this equipment? This action cannot be undone.</p>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setItemToDelete(null)}>Cancel</Button>
            <Button type="button" variant="danger" onClick={confirmDelete}>Delete Equipment</Button>
          </div>
        </div>
      </Modal>

      {/* QR Scanner */}
      <QRCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScan}
      />

      {/* Print QR Code Dialog */}
      <QRCodePrintDialog
        isOpen={isPrintDialogOpen}
        onClose={() => {
          setIsPrintDialogOpen(false);
          setItemToPrintSingle(null);
        }}
        items={
          itemToPrintSingle
            ? (printByUnit && itemToPrintSingle.quantity > 1
                ? Array.from({ length: itemToPrintSingle.quantity }, (_, i) => ({
                    controlNumber: formatUnitControlNumber(itemToPrintSingle.control_number, i + 1, itemToPrintSingle.quantity),
                    name: itemToPrintSingle.name,
                  }))
                : [{ controlNumber: itemToPrintSingle.control_number, name: itemToPrintSingle.name }]
              )
            : selectedItems
        }
      />
    </div>
  );
}
