"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Package, Loader2, LogIn, UserPlus } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let finalEmail = identifier.trim();
      
      if (isLogin && !finalEmail.includes('@')) {
        const res = await fetch('/api/auth/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: finalEmail })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Account not found. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your .env if resolving usernames.');
        finalEmail = data.email;
      }

      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password,
        });
        if (signInError) throw signInError;
      } else {
        if (!finalEmail.includes('@')) {
          throw new Error('Please use a valid email address to sign up.');
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: finalEmail,
          password,
        });
        if (signUpError) throw signUpError;
        
        if (data?.session) {
          setSuccess('Account created successfully!');
        } else {
          setSuccess('Account created! Please check your email to verify your account.');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const finalEmail = identifier.trim();
    if (!finalEmail.includes('@')) {
      setError('Please enter your registered email address above first.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(finalEmail);
      if (error) throw error;
      setSuccess('Password reset instructions sent to your email.');
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <div className="p-8 text-center bg-blue-600 dark:bg-blue-900/50">
          <div className="inline-flex items-center justify-center p-3 bg-white/20 rounded-xl mb-4">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ShelfManager</h1>
          <p className="text-blue-100 text-sm mt-1">Login to Access the Inventory System</p>
        </div>

        <div className="p-8">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-900 p-1 mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                isLogin 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                !isLogin 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
                {success}
              </div>
            )}

            <Input
              label={isLogin ? "Email, Username, or Phone" : "Email Address"}
              type={isLogin && !identifier.includes('@') ? "text" : "email"}
              required
              placeholder={isLogin ? "you@example.com or username" : "you@example.com"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            
            <div className="relative">
              <Input
                label="Password"
                type="password"
                required
                placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
              {isLogin && (
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="absolute right-0 top-0 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Forgot password?
                </button>
              )}
            </div>

            <Button type="submit" className="w-full py-2.5 mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> {isLogin ? 'Signing In...' : 'Creating Account...'}
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
