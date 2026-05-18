"use client";

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Equipment, Quality } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { Plus, Search, Loader2, Edit, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function Inventory() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    control_number: '',
    name: '',
    quantity: 1,
    quality: 'New' as Quality,
    department: '',
    location: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipment();
      setEquipment(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch equipment:', err);
      setError(err?.message || 'An unknown error occurred while fetching equipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createEquipment(formData);
      setIsAddModalOpen(false);
      setFormData({
        control_number: '',
        name: '',
        quantity: 1,
        quality: 'New',
        department: '',
        location: ''
      });
      loadData();
    } catch (error: any) {
      console.error('Failed to create equipment:', error);
      alert(`Failed to add equipment: ${error?.message || 'Unknown error'}`);
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
    } catch (error: any) {
      console.error('Failed to delete equipment:', error);
      alert(`Failed to delete equipment: ${error?.message || 'Unknown error'}`);
    }
  };

  const filtered = equipment.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.control_number.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Item
        </Button>
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
                  <th className="px-6 py-3 font-medium">Control No.</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">Quality</th>
                  <th className="px-6 py-3 font-medium">Dept. & Location</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-gray-300">{item.control_number}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4">{item.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium
                        ${item.quality === 'New' || item.quality === 'Good' ? 'bg-green-100 text-green-700' : 
                          item.quality === 'Fair' || item.quality === 'Poor' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'}
                      `}>
                        {item.quality}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>{item.department}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{item.location}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
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
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
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
          <Input 
            label="Control Number" 
            required 
            value={formData.control_number} 
            onChange={e => setFormData({...formData, control_number: e.target.value})} 
          />
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
    </div>
  );
}
