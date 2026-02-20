'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase, Task } from '@/lib/supabase';
import { ListTodo, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import TaskCard from '@/components/TaskCard';
import TaskForm from '@/components/TaskForm';

export default function TasksPage() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    subscribeToUpdates();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      setTasks(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const subscription = supabase
      .channel('tasks-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      fetchTasks();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const columns = {
    todo: { title: 'To Do', color: 'text-neon-blue' },
    in_progress: { title: 'In Progress', color: 'text-neon-purple' },
    review: { title: 'Review', color: 'text-orange-400' },
    done: { title: 'Done', color: 'text-neon-green' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
              <ListTodo className="w-8 h-8 text-neon-purple" />
              Team Tasks
            </h1>
            <p className="text-gray-400">Manage and track team projects</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="glass-button flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>
      </motion.div>

      {/* Form */}
      {showForm && (
        <TaskForm
          onSuccess={() => {
            fetchTasks();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-blue border-t-transparent"></div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(columns).map(([status, { title, color }]) => {
            const columnTasks = tasks.filter(t => t.status === status);

            return (
              <motion.div
                key={status}
                className="card min-h-96 flex flex-col"
              >
                <h3 className={`text-lg font-bold mb-4 ${color}`}>
                  {title}
                  <span className="ml-2 text-sm text-gray-400 font-normal">
                    {columnTasks.length}
                  </span>
                </h3>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No tasks</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleTaskStatusChange}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
