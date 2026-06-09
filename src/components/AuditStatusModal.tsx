"use client";

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Quality, Equipment } from '@/lib/types';
import { Loader2, ClipboardList } from 'lucide-react';

interface AuditStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  auditedBy: string;
  onSave: (quantity: number, quality: Quality, notes: string) => Promise<void>;
  isDuplicate?: boolean;
  initialQuantity?: number;
  initialQuality?: Quality;
  initialNotes?: string;
}

export function AuditStatusModal({
  isOpen,
  onClose,
  equipment,
  auditedBy,
  onSave,
  isDuplicate,
  initialQuantity,
  initialQuality,
  initialNotes,
}: AuditStatusModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity ?? equipment.quantity);
  const [quality, setQuality] = useState<Quality>(initialQuality ?? equipment.quality);
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(quantity, quality, notes);
      onClose();
    } catch (error) {
      console.error('Failed to save audit record:', error);
      alert('Failed to save audit record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isDuplicate ? `Edit: ${equipment.name}` : `Audit: ${equipment.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isDuplicate && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/30 dark:border-amber-800/50">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Editing existing audit record for this item.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Save to update the quantity, quality, and notes.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Control Number: <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{equipment.control_number}</span>
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Quantity"
            type="number"
            min={0}
            required
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Broken">Broken</option>
            </select>
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Audited by
          </label>
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white px-3 py-2 text-sm cursor-not-allowed"
            value={auditedBy}
            disabled
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="e.g. Item is in good condition, located in..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            {isDuplicate ? 'Update Record' : 'Save Audit Record'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
