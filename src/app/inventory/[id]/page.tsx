"use client";

import React, { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { Equipment, Comment, Quality } from '@/lib/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal } from '@/components/Modal';
import { ArrowLeft, Loader2, Edit, MessageSquare, Package, Save } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EquipmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Equipment>>({});

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadData = async () => {
    try {
      const [eqData, commentsData] = await Promise.all([
        api.getEquipmentById(id),
        api.getComments(id)
      ]);
      setEquipment(eqData);
      setComments(commentsData);
      setEditForm({
        name: eqData.name,
        quantity: eqData.quantity,
        quality: eqData.quality,
        department: eqData.department,
        location: eqData.location
      });
    } catch (error) {
      console.error('Failed to load equipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEdit(true);
    try {
      await api.updateEquipment(id, editForm);
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to update equipment:', error);
      alert('Failed to update equipment.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      await api.addComment(id, newComment, author || 'Anonymous');
      setNewComment('');
      loadData(); // refresh comments
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Equipment Not Found</h1>
        <Link href="/inventory">
          <Button variant="secondary">Back to Inventory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/inventory" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Inventory
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Equipment Details */}
        <div className="flex-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <Package className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <span className="font-mono text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {equipment.control_number}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{equipment.name}</h1>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit
              </Button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Quantity</h3>
                <p className="text-lg font-medium text-gray-900 dark:text-white">{equipment.quantity}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Quality</h3>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                  ${equipment.quality === 'New' || equipment.quality === 'Good' ? 'bg-green-100 text-green-700' : 
                    equipment.quality === 'Fair' || equipment.quality === 'Poor' ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'}
                `}>
                  {equipment.quality}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Department</h3>
                <p className="text-gray-900 dark:text-white">{equipment.department}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                <p className="text-gray-900 dark:text-white">{equipment.location}</p>
              </div>
              <div className="col-span-2 text-xs text-gray-400 dark:text-gray-500 mt-2">
                Last updated: {format(new Date(equipment.updated_at), 'PPpp')}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="md:w-96 flex flex-col h-[calc(100vh-8rem)]">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Notes & Comments</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm border border-transparent dark:border-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-200">{comment.author}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
                  No comments yet.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <Input 
                  placeholder="Your name (optional)" 
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  className="h-8 text-sm"
                />
                <textarea
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add a note about condition, maintenance, etc."
                  rows={3}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  required
                />
                <Button type="submit" disabled={submittingComment || !newComment.trim()} className="w-full">
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Equipment">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input 
            label="Name" 
            required 
            value={editForm.name || ''} 
            onChange={e => setEditForm({...editForm, name: e.target.value})} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantity" 
              type="number" 
              min={0} 
              required 
              value={editForm.quantity || 0} 
              onChange={e => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})} 
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality</label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={editForm.quality}
                onChange={e => setEditForm({...editForm, quality: e.target.value as Quality})}
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
            value={editForm.department || ''} 
            onChange={e => setEditForm({...editForm, department: e.target.value})} 
          />
          <Input 
            label="Location" 
            required 
            value={editForm.location || ''} 
            onChange={e => setEditForm({...editForm, location: e.target.value})} 
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submittingEdit} className="flex items-center gap-2">
              {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
