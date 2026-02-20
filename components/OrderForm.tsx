'use client';

import React, { useState } from 'react';
import { Order } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/authStore';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface OrderFormProps {
  order?: Order;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    order_number: order?.order_number || '',
    client_name: order?.client_name || '',
    items_count: order?.items_count || 0,
    total_amount: order?.total_amount || 0,
    status: order?.status || 'intake',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.order_number || !formData.client_name) {
      setError('Order number and client name are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (order) {
        // Update
        const { error: err } = await supabase
          .from('orders')
          .update(formData)
          .eq('id', order.id);
        if (err) throw err;
      } else {
        // Create
        const { error: err } = await supabase.from('orders').insert([
          {
            ...formData,
            created_by: user?.id,
          },
        ]);
        if (err) throw err;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
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

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Order Number</label>
            <input
              type="text"
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Items Count</label>
            <input
              type="number"
              value={formData.items_count}
              onChange={(e) => setFormData({ ...formData, items_count: parseInt(e.target.value) || 0 })}
              className="form-input"
              disabled={loading}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Total Amount</label>
            <input
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
              className="form-input"
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group sm:col-span-2">
            <label className="form-label">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="form-select"
              disabled={loading}
            >
              <option value="intake">Intake</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 glass-button bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50"
          >
            {loading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
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
