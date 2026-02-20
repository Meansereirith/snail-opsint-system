'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  target?: string;
  subtitle?: string;
  progress?: number;
  status: 'success' | 'pending' | 'warning' | 'error';
}

export default function MetricCard({
  icon,
  title,
  value,
  target,
  subtitle,
  progress,
  status,
}: MetricCardProps) {
  const statusColors = {
    success: { text: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/30' },
    pending: { text: 'text-neon-blue', bg: 'bg-neon-blue/10', border: 'border-neon-blue/30' },
    warning: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    error: { text: 'text-neon-pink', bg: 'bg-neon-pink/10', border: 'border-neon-pink/30' },
  };

  const colors = statusColors[status];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`card glass-hover ${colors.border}`}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text} mb-4`}>
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="text-2xl font-bold">{value}</p>
        {target && <p className="text-sm text-gray-500">{target}</p>}
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className="mb-2">
          <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r from-neon-blue to-neon-purple`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progress.toFixed(0)}% of goal</p>
        </div>
      )}

      {/* Subtitle */}
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}

      {/* Status Badge */}
      <div className={`mt-4 inline-flex items-center gap-1 ${colors.text}`}>
        <div className={`w-2 h-2 rounded-full ${colors.bg} ${colors.border} border`}></div>
        <span className="text-xs font-medium capitalize">{status}</span>
      </div>
    </motion.div>
  );
}
