'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase, Inventory } from '@/lib/supabase';
import { Package, Plus, AlertTriangle, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import InventoryForm from '@/components/InventoryForm';

export default function InventoryPage() {
  const { hasPermission, isAdmin } = useAuthStore();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const canEdit = hasPermission('inventory', 'edit') || isAdmin;

  useEffect(() => {
    fetchInventory();
    subscribeToUpdates();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error: err } = await supabase
        .from('inventory')
        .select('*')
        .order('name');

      if (err) throw err;
      setInventory(data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load inventory');
      console.error(err);
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const subscription = supabase
      .channel('inventory-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this inventory item?')) return;

    try {
      const { error: err } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId);

      if (err) throw err;
      setInventory(inventory.filter(i => i.id !== itemId));
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  const filteredInventory = inventory.filter(
    item =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = filteredInventory.filter(item => item.quantity <= item.reorder_level);
  const stats = {
    totalItems: filteredInventory.length,
    lowStock: lowStockItems.length,
    totalValue: filteredInventory.reduce((sum, item) => sum + (item.unit_cost || 0) * item.quantity, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
              <Package className="w-8 h-8 text-neon-green" />
              Inventory
            </h1>
            <p className="text-gray-400">Manage stock, BOMs, and assembly operations</p>
          </div>
          {canEdit && (
            <button
              onClick={() => {
                setEditingItem(null);
                setShowForm(!showForm);
              }}
              className="glass-button flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Item
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <p className="text-sm text-gray-400 mb-2">Total Items</p>
          <p className="text-3xl font-bold text-neon-blue">{stats.totalItems}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <p className="text-sm text-gray-400 mb-2">Low Stock</p>
          <p className={`text-3xl font-bold ${stats.lowStock > 0 ? 'text-orange-400' : 'text-neon-green'}`}>
            {stats.lowStock}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <p className="text-sm text-gray-400 mb-2">Total Value</p>
          <p className="text-3xl font-bold text-neon-purple">${stats.totalValue.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Form */}
      {showForm && canEdit && (
        <InventoryForm
          item={editingItem || undefined}
          onSuccess={() => {
            fetchInventory();
            setShowForm(false);
            setEditingItem(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      {error && (
        <div className="p-4 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink rounded-lg">
          {error}
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 glass bg-orange-500/10 border-orange-500/30 rounded-lg"
        >
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-400 mb-1">Low Stock Alert</p>
              <p className="text-sm text-orange-300/80">
                {lowStockItems.length} item{lowStockItems.length !== 1 ? 's' : ''} below reorder level
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by SKU or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input w-full"
        />
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-blue border-t-transparent"></div>
        </div>
      ) : filteredInventory.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No inventory items found</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left font-semibold">SKU</th>
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-center font-semibold">Quantity</th>
                <th className="px-6 py-3 text-center font-semibold">Reorder Level</th>
                <th className="px-6 py-3 text-right font-semibold">Unit Cost</th>
                <th className="px-6 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item, idx) => {
                const isLowStock = item.quantity <= item.reorder_level;
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="table-row cursor-pointer"
                    onClick={() => canEdit && (setEditingItem(item), setShowForm(true))}
                  >
                    <td className="px-6 py-3 font-mono font-semibold text-neon-blue">{item.sku}</td>
                    <td className="px-6 py-3">{item.name}</td>
                    <td className="px-6 py-3 text-center font-semibold">
                      <span className={isLowStock ? 'text-orange-400' : 'text-neon-green'}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center text-gray-400">{item.reorder_level}</td>
                    <td className="px-6 py-3 text-right">${item.unit_cost?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-3 text-center">
                      {isLowStock ? (
                        <span className="status-badge status-warning flex items-center gap-1 justify-center">
                          <TrendingDown className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="status-badge status-success">In Stock</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
