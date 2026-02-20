'use client';

import React, { useState, useEffect } from 'react';
import { Role } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface RoleFormProps {
  role?: Role;
  onSubmit: (data: { name: string; description: string }) => Promise<void>;
  onCancel: () => void;
}

export default function RoleForm({ role, onSubmit, onCancel }: RoleFormProps) {
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4 p-4 glass rounded-lg mb-4"
    >
      {error && (
        <div className="p-2 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink text-xs rounded">
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Role Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Marketing Manager"
          className="form-input"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this role..."
          className="form-input resize-none h-20"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 glass-button text-sm"
        >
          {loading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="glass-button text-sm px-3"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.form>
  );
}
