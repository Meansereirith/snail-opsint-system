'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  ListTodo,
  DollarSign,
  Settings,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, hasPermission } = useAuthStore();

  const menuItems = [
    { href: '/dashboard', icon: BarChart3, label: 'Mission Control', public: true },
    { href: '/dashboard/orders', icon: ShoppingCart, label: 'Orders', permission: 'orders', action: 'view' },
    { href: '/dashboard/inventory', icon: Package, label: 'Inventory', permission: 'inventory', action: 'view' },
    { href: '/dashboard/tasks', icon: ListTodo, label: 'Tasks', public: true },
    { href: '/dashboard/payables', icon: DollarSign, label: 'Payables', permission: 'payables', action: 'view' },
    { href: '/dashboard/team', icon: Users, label: 'Team', public: true },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings', admin: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <motion.div
        className={`fixed lg:relative w-64 h-screen glass border-r border-white/10 flex flex-col z-50 lg:z-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        animate={{ x: open ? 0 : -256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-lg">
              🐌
            </div>
            <span className="font-bold text-lg hidden sm:inline">Snail</span>
          </Link>
          <button
            onClick={onToggle}
            className="lg:hidden p-1 glass-hover rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            // Check if user has permission to view this item
            const hasAccess =
              item.public ||
              (isAdmin && item.admin) ||
              (item.permission && hasPermission(item.permission, item.action || 'view'));

            if (!hasAccess) return null;

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    isActive
                      ? 'glass bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50 text-neon-blue'
                      : 'glass-hover'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="glass p-3 text-xs text-center text-gray-400">
            <p className="font-semibold mb-1">Snail Studio Ops</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </motion.div>
    </>
  );
}
