"use client";

import React, { useState } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import { Moon, Sun, Monitor, Wrench, User, Trash2, LogOut, Loader2 } from 'lucide-react';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { user, signOut } = useAuth();
  
  // Account Form States
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(user?.user_metadata?.username || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState({ type: '', text: '' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
