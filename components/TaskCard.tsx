'use client';

import React, { useState } from 'react';
import { Task } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const priorityColors = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-neon-pink',
  };

  const statusOptions = ['todo', 'in_progress', 'review', 'done'];

  const handleStatusSelect = (newStatus: string) => {
    if (newStatus !== task.status) {
      onStatusChange(task.id, newStatus);
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card glass-hover p-4"
    >
      <div className="space-y-3">
        {/* Title */}
        <h4 className="font-semibold text-sm line-clamp-2 group/title">
          {task.title}
        </h4>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {/* Priority */}
          <span className={`text-xs font-medium capitalize ${priorityColors[task.priority as keyof typeof priorityColors] || 'text-gray-400'}`}>
            {task.priority}
          </span>

          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-xs px-2 py-1 glass-hover rounded flex items-center gap-1"
            >
              {task.status.replace('_', ' ')}
              <ChevronDown className="w-3 h-3" />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full right-0 mt-1 glass rounded-lg overflow-hidden shadow-xl z-10"
              >
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusSelect(status)}
                    className={`block w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors ${
                      status === task.status ? 'bg-neon-blue/20 text-neon-blue' : ''
                    }`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
