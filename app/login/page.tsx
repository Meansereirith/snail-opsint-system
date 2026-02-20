'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-neon-purple/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 glass rounded-xl mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold">🐌</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Snail Studio</h1>
          <p className="text-gray-400">Operations Intelligence Dashboard</p>
        </div>

        {/* Login Card */}
        <div className="card border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Mail className="w-4 h-4 text-neon-blue" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="form-label flex items-center gap-2">
                <Lock className="w-4 h-4 text-neon-purple" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink text-sm rounded-lg">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full glass-button bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50 hover:from-neon-blue/30 hover:to-neon-purple/30 font-semibold py-3 mt-6"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center mb-3">Demo Credentials</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center glass px-3 py-2 bg-dark-800/50">
                <span className="text-gray-400">CEO:</span>
                <span className="font-mono text-neon-blue">ceo@snail.studio</span>
              </div>
              <div className="flex justify-between items-center glass px-3 py-2 bg-dark-800/50">
                <span className="text-gray-400">Assistant:</span>
                <span className="font-mono text-neon-purple">ops@snail.studio</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          Snail Studio Operations Intelligence © 2026
        </p>
      </div>
    </div>
  );
}
