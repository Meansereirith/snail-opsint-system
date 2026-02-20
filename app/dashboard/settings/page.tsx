'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { supabase, Role, Permission } from '@/lib/supabase';
import { Lock, Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import RoleForm from '@/components/RoleForm';
import RolePermissionManager from '@/components/RolePermissionManager';

export default function SettingsPage() {
  const { isAdmin } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchRolesAndPermissions();
  }, [isAdmin]);

  const fetchRolesAndPermissions = async () => {
    try {
      setLoading(true);
      const [{ data: rolesData }, { data: permsData }] = await Promise.all([
        supabase.from('roles').select('*').order('name'),
        supabase.from('permissions').select('*').order('resource'),
      ]);

      setRoles(rolesData || []);
      setPermissions(permsData || []);
    } catch (err) {
      setError('Failed to load roles and permissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData: { name: string; description: string }) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select()
        .single();

      if (error) throw error;
      setRoles([...roles, data]);
      setShowRoleForm(false);
      setError('');
    } catch (err) {
      setError('Failed to create role');
      console.error(err);
    }
  };

  const handleUpdateRole = async (roleId: string, roleData: { name: string; description: string }) => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update(roleData)
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;
      setRoles(roles.map(r => r.id === roleId ? data : r));
      setEditingRole(null);
      setError('');
    } catch (err) {
      setError('Failed to update role');
      console.error(err);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure? This role will be deleted.')) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      setRoles(roles.filter(r => r.id !== roleId));
      if (selectedRole?.id === roleId) setSelectedRole(null);
      setError('');
    } catch (err) {
      setError('Failed to delete role');
      console.error(err);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card border-neon-pink/30 bg-neon-pink/10 p-8 text-center">
        <Lock className="w-12 h-12 text-neon-pink mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-400">Only administrators can access settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Manage roles, permissions, and system configuration</p>
      </motion.div>

      {/* Roles Management */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-neon-blue" />
                Roles
              </h2>
              <button
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleForm(!showRoleForm);
                }}
                className="glass-button text-sm px-3 py-1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink text-sm rounded-lg mb-4">
                {error}
              </div>
            )}

            {showRoleForm && !editingRole && (
              <RoleForm
                onSubmit={handleCreateRole}
                onCancel={() => setShowRoleForm(false)}
              />
            )}

            {editingRole && (
              <RoleForm
                role={editingRole}
                onSubmit={(data) => handleUpdateRole(editingRole.id, data)}
                onCancel={() => setEditingRole(null)}
              />
            )}

            <div className="space-y-2">
              {roles.map((role) => (
                <motion.button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  whileHover={{ x: 4 }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedRole?.id === role.id
                      ? 'glass bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 border-neon-blue/50'
                      : 'glass-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{role.name}</p>
                      <p className="text-xs text-gray-400 truncate">{role.description}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRole(role);
                        }}
                        className="p-1 glass-hover rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!['CEO', 'Admin'].includes(role.name) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role.id);
                          }}
                          className="p-1 glass-hover rounded text-neon-pink"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Permissions Manager */}
        {selectedRole && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <RolePermissionManager
              role={selectedRole}
              permissions={permissions}
              onUpdate={fetchRolesAndPermissions}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
