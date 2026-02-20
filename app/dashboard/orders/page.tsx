'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase, Order } from '@/lib/supabase';
import { ShoppingCart, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import OrderForm from '@/components/OrderForm';

export default function OrdersPage() {
  const { hasPermission, isAdmin } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const canCreate = hasPermission('orders', 'create') || isAdmin;
  const canEdit = hasPermission('orders', 'edit') || isAdmin;

  useEffect(() => {
    fetchOrders();
    subscribeToUpdates();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setOrders(data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const subscription = supabase
      .channel('orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleDelete = async (orderId: string) => {
    if (!confirm('Delete this order?')) return;

    try {
      const { error: err } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (err) throw err;
      setOrders(orders.filter(o => o.id !== orderId));
    } catch (err) {
      setError('Failed to delete order');
      console.error(err);
    }
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
              <ShoppingCart className="w-8 h-8 text-neon-blue" />
              Orders
            </h1>
            <p className="text-gray-400">Track and manage customer orders</p>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setEditingOrder(null);
                setShowForm(!showForm);
              }}
              className="glass-button flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Order
            </button>
          )}
        </div>
      </motion.div>

      {/* Form */}
      {showForm && canCreate && (
        <OrderForm
          order={editingOrder || undefined}
          onSuccess={() => {
            fetchOrders();
            setShowForm(false);
            setEditingOrder(null);
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingOrder(null);
          }}
        />
      )}

      {error && (
        <div className="p-4 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'intake', 'processing', 'shipped', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              filter === status
                ? 'glass bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50'
                : 'glass-hover'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-blue border-t-transparent"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No orders found</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left font-semibold">Order #</th>
                <th className="px-6 py-3 text-left font-semibold">Client</th>
                <th className="px-6 py-3 text-center font-semibold">Items</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
                <th className="px-6 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="table-row"
                >
                  <td className="px-6 py-3 font-mono font-semibold text-neon-blue">
                    #{order.order_number}
                  </td>
                  <td className="px-6 py-3">{order.client_name}</td>
                  <td className="px-6 py-3 text-center">{order.items_count}</td>
                  <td className="px-6 py-3 text-right font-semibold">
                    ${order.total_amount?.toLocaleString() || '0.00'}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`status-badge status-${order.status === 'shipped' ? 'success' : 'pending'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {canEdit && (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setEditingOrder(order);
                            setShowForm(true);
                          }}
                          className="p-2 glass-hover rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 glass-hover rounded text-neon-pink"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
