'use client';

import React, { useState } from 'react';
import { Inventory } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface InventoryFormProps {
  item?: Inventory;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function InventoryForm({ item, onSuccess, onCancel }: InventoryFormProps) {
  const [formData, setFormData] = useState({
    sku: item?.sku || '',
    name: item?.name || '',
    quantity: item?.quantity || 0,
    reorder_level: item?.reorder_level || 10,
    unit_cost: item?.unit_cost || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      setError('SKU and name are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (item) {
        // Update
        const { error: err } = await supabase
          .from('inventory')
          .update(formData)
          .eq('id', item.id);
        if (err) throw err;
      } else {
        // Create
        const { error: err } = await supabase.from('inventory').insert([formData]);
        if (err) throw err;
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
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
            <label className="form-label">SKU</label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Current Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="form-input"
              disabled={loading}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reorder Level</label>
            <input
              type="number"
              value={formData.reorder_level}
              onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 10 })}
              className="form-input"
              disabled={loading}
              min="0"
            />
          </div>

          <div className="form-group sm:col-span-2">
            <label className="form-label">Unit Cost</label>
            <input
              type="number"
              value={formData.unit_cost}
              onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
              className="form-input"
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 glass-button bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border-neon-green/50"
          >
            {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
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
