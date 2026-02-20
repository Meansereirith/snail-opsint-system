'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase, Payable } from '@/lib/supabase';
import { DollarSign, AlertCircle, Plus, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import PayableForm from '@/components/PayableForm';
import { formatDistanceToNow } from 'date-fns';

export default function PayablesPage() {
  const { isAdmin } = useAuthStore();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!isAdmin) return;
    fetchPayables();
    subscribeToUpdates();
  }, [isAdmin]);

  const fetchPayables = async () => {
    try {
      const { data, error: err } = await supabase
        .from('payables')
        .select('*')
        .order('due_date', { ascending: true });

      if (err) throw err;
      setPayables(data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load payables');
      console.error(err);
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const subscription = supabase
      .channel('payables-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payables' }, () => {
        fetchPayables();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  if (!isAdmin) {
    return (
      <div className="card border-neon-pink/30 bg-neon-pink/10 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-neon-pink mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-400">Only administrators can access payables.</p>
      </div>
    );
  }

  const filteredPayables = filterType === 'all' ? payables : payables.filter(p => p.type === filterType);
  const overdue = filteredPayables.filter(p => p.status === 'pending' && new Date(p.due_date) < new Date());
  const upcoming = filteredPayables.filter(p => p.status === 'pending' && new Date(p.due_date) >= new Date());

  const stats = {
    totalDue: filteredPayables
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0),
    overdue: overdue.reduce((sum, p) => sum + p.amount, 0),
    paid: filteredPayables
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
              <DollarSign className="w-8 h-8 text-neon-green" />
              Payables & Payroll
            </h1>
            <p className="text-gray-400">Track expenses, vendor payments, and payroll</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="glass-button flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Payable
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card">
          <p className="text-sm text-gray-400 mb-2">Total Due</p>
          <p className="text-3xl font-bold text-neon-blue">${stats.totalDue.toLocaleString()}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`card ${overdue.length > 0 ? 'border-orange-500/30 bg-orange-500/5' : ''}`}
        >
          <p className="text-sm text-gray-400 mb-2">Overdue</p>
          <p className={`text-3xl font-bold ${overdue.length > 0 ? 'text-orange-400' : 'text-neon-green'}`}>
            ${stats.overdue.toLocaleString()}
          </p>
          {overdue.length > 0 && (
            <p className="text-xs text-orange-400 mt-1">{overdue.length} item(s)</p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <p className="text-sm text-gray-400 mb-2">Paid This Period</p>
          <p className="text-3xl font-bold text-neon-purple">${stats.paid.toLocaleString()}</p>
        </motion.div>
      </div>

      {/* Form */}
      {showForm && (
        <PayableForm
          onSuccess={() => {
            fetchPayables();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {error && (
        <div className="p-4 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink rounded-lg">
          {error}
        </div>
      )}

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 glass bg-orange-500/10 border-orange-500/30 rounded-lg"
        >
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-400 mb-1">⚠️ Overdue Payments</p>
              <p className="text-sm text-orange-300/80">
                {overdue.length} payment{overdue.length !== 1 ? 's' : ''} overdue totaling ${stats.overdue.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'payroll', 'vendor', 'expense'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              filterType === type
                ? 'glass bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50'
                : 'glass-hover'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Payables Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-blue border-t-transparent"></div>
        </div>
      ) : filteredPayables.length === 0 ? (
        <div className="card text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No payables found</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-6 py-3 text-left font-semibold">Description</th>
                <th className="px-6 py-3 text-left font-semibold">Type</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-left font-semibold">Due Date</th>
                <th className="px-6 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayables.map((payable, idx) => {
                const isOverdue = payable.status === 'pending' && new Date(payable.due_date) < new Date();
                return (
                  <motion.tr
                    key={payable.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`table-row ${isOverdue ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className="px-6 py-3">{payable.description}</td>
                    <td className="px-6 py-3 capitalize">{payable.type}</td>
                    <td className="px-6 py-3 text-right font-semibold text-neon-pink">
                      ${payable.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className={isOverdue ? 'text-orange-400 font-semibold' : ''}>
                          {formatDistanceToNow(new Date(payable.due_date), { addSuffix: true })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`status-badge ${
                        payable.status === 'paid' ? 'status-success' : isOverdue ? 'status-error' : 'status-warning'
                      }`}>
                        {payable.status.charAt(0).toUpperCase() + payable.status.slice(1)}
                      </span>
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
