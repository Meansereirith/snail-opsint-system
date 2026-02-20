'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/authStore';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface PayableFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PayableForm({ onSuccess, onCancel }: PayableFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    description: '',
    type: 'vendor',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || formData.amount <= 0) {
      setError('Description and amount are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: err } = await supabase.from('payables').insert([
        {
          ...formData,
          created_by: user?.id,
        },
      ]);

      if (err) throw err;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card mb-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., January Payroll, Vendor Invoice #1234"
            className="form-input"
            disabled={loading}
            required
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="form-select"
              disabled={loading}
            >
              <option value="payroll">Payroll</option>
              <option value="vendor">Vendor</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="form-input"
              disabled={loading}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="form-input"
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="form-select"
            disabled={loading}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 glass-button bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border-neon-green/50"
          >
            {loading ? 'Creating...' : 'Add Payable'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="glass-button px-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}
