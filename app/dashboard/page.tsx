'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase } from '@/lib/supabase';
import { TrendingUp, AlertCircle, DollarSign, Users, Package, Zap } from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user, role } = useAuthStore();
  const [metrics, setMetrics] = useState({
    profitToday: 0,
    profitGoal: 10000,
    activeOrders: 0,
    inventory: 0,
    tasks: 0,
    alerts: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    subscribeToRealtimeUpdates();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'shipped');

      // Fetch inventory
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*');

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'done');

      // Fetch low stock alerts
      const lowStock = inventory?.filter((item: any) => item.quantity <= item.reorder_level) || [];

      // Calculate profit (simplified)
      const profit = (orders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0) * 0.3;

      setMetrics({
        profitToday: Math.floor(profit),
        profitGoal: 10000,
        activeOrders: orders?.length || 0,
        inventory: inventory?.length || 0,
        tasks: tasks?.length || 0,
        alerts: lowStock.length,
      });

      // Generate chart data (mock for now)
      setChartData(
        Array.from({ length: 7 }, (_, i) => ({
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
          profit: Math.floor(Math.random() * 3000 + 2000),
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
    }
  };

  const subscribeToRealtimeUpdates = () => {
    const subscription = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const profitPercentage = (metrics.profitToday / metrics.profitGoal) * 100;

  return (
    <div className="space-y-8">
      {/* Mission Control Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card border-neon-blue/30 bg-gradient-to-r from-dark-800/50 to-dark-700/50"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Mission Control
              <span className="text-neon-blue ml-2">🚀</span>
            </h1>
            <p className="text-gray-400">Welcome back, {user?.full_name || 'Team Member'}</p>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-3xl font-bold text-neon-green">
              ${metrics.profitToday.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400">Today's Profit</p>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign className="w-6 h-6" />}
          title="Daily Profit"
          value={`$${metrics.profitToday.toLocaleString()}`}
          target={`/ $${metrics.profitGoal.toLocaleString()}`}
          progress={profitPercentage}
          status={profitPercentage >= 100 ? 'success' : 'pending'}
        />
        <MetricCard
          icon={<Package className="w-6 h-6" />}
          title="Active Orders"
          value={metrics.activeOrders.toString()}
          subtitle="Orders in progress"
          status="pending"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          title="Inventory Items"
          value={metrics.inventory.toString()}
          subtitle="Total SKUs"
          status="success"
        />
        <MetricCard
          icon={metrics.alerts > 0 ? <AlertCircle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
          title="Alerts"
          value={metrics.alerts.toString()}
          subtitle="Low stock items"
          status={metrics.alerts > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Profit Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-neon-blue" />
          Weekly Profit Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 17, 23, 0.95)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
              }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#00d9ff"
              strokeWidth={2}
              dot={{ fill: '#bb86fc', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Tasks Summary */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-purple" />
            Active Tasks
          </h3>
          <p className="text-3xl font-bold text-neon-purple mb-2">{metrics.tasks}</p>
          <p className="text-sm text-gray-400">Team tasks in progress</p>
        </div>

        {/* Role Info */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Your Role</h3>
          <p className="text-2xl font-bold text-neon-green mb-2">{role?.name}</p>
          <p className="text-sm text-gray-400">{role?.description}</p>
        </div>
      </motion.div>
    </div>
  );
}
