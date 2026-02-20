'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase, User, Role } from '@/lib/supabase';
import { Users, Mail, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TeamPage() {
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<(User & { roles?: Role })[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*, roles(id, name, description)')
        .order('email');

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('name');

      if (usersError || rolesError) throw usersError || rolesError;

      setUsers(usersData || []);
      setRoles(rolesData || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load team data');
      console.error(err);
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    if (!isAdmin) return;

    try {
      const { error: err } = await supabase
        .from('users')
        .update({ role_id: newRoleId })
        .eq('id', userId);

      if (err) throw err;
      fetchTeamData();
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'ceo':
        return 'text-neon-pink border-neon-pink/50 bg-neon-pink/10';
      case 'admin':
        return 'text-neon-purple border-neon-purple/50 bg-neon-purple/10';
      case 'ops assistant':
        return 'text-neon-blue border-neon-blue/50 bg-neon-blue/10';
      case 'accountant':
        return 'text-neon-green border-neon-green/50 bg-neon-green/10';
      default:
        return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
            <Users className="w-8 h-8 text-neon-blue" />
            Team Members
          </h1>
          <p className="text-gray-400">Manage team roles and permissions</p>
        </div>
      </motion.div>

      {error && (
        <div className="p-4 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink rounded-lg">
          {error}
        </div>
      )}

      {/* Team List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-blue border-t-transparent"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No team members found</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
          {users.map((user, idx) => {
            const userRole = user.roles as any;
            const roleName = userRole?.name || 'Unassigned';
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                {/* User Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{user.full_name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>

                {/* Role Badge */}
                <div className="flex items-center gap-4">
                  {isAdmin ? (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <select
                        value={user.role_id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium glass border transition-all cursor-pointer ${getRoleColor(roleName)}`}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium glass border status-badge ${getRoleColor(roleName)}`}>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {roleName}
                      </div>
                    </div>
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
