'use client';

import React, { useEffect, useState } from 'react';
import { Role, Permission } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Shield, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RolePermissionManagerProps {
  role: Role;
  permissions: Permission[];
  onUpdate: () => Promise<void>;
}

export default function RolePermissionManager({
  role,
  permissions,
  onUpdate,
}: RolePermissionManagerProps) {
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRolePermissions();
  }, [role.id]);

  const fetchRolePermissions = async () => {
    try {
      const { data } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', role.id);

      setRolePermissions(data?.map(rp => rp.permission_id) || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (permissionId: string) => {
    const hasPermission = rolePermissions.includes(permissionId);

    try {
      setSaving(true);
      setError('');

      if (hasPermission) {
        // Remove permission
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', role.id)
          .eq('permission_id', permissionId);

        if (deleteError) throw deleteError;
        setRolePermissions(rolePermissions.filter(id => id !== permissionId));
      } else {
        // Add permission
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert([{ role_id: role.id, permission_id: permissionId }]);

        if (insertError) throw insertError;
        setRolePermissions([...rolePermissions, permissionId]);
      }

      await onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update permissions');
      console.error('Error updating permission:', err);
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const isProtectedRole = ['CEO', 'Admin'].includes(role.name);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="w-5 h-5 text-neon-purple" />
          {role.name} Permissions
        </h3>
        <div className="text-sm text-gray-400">{rolePermissions.length} of {permissions.length}</div>
      </div>

      {error && (
        <div className="p-3 glass bg-neon-pink/10 border-neon-pink/30 text-neon-pink text-sm rounded-lg mb-4">
          {error}
        </div>
      )}

      {isProtectedRole && (
        <div className="p-3 glass bg-neon-blue/10 border-neon-blue/30 text-neon-blue text-sm rounded-lg mb-4">
          {role.name} has all permissions by default and cannot be modified.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-neon-blue border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([resource, resourcePerms]) => (
            <motion.div
              key={resource}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass bg-dark-800/50 p-4 rounded-lg"
            >
              <h4 className="text-sm font-semibold uppercase tracking-wider text-neon-green mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {resource}
              </h4>

              <div className="grid sm:grid-cols-2 gap-2">
                {resourcePerms.map((perm) => {
                  const hasPermission = rolePermissions.includes(perm.id);

                  return (
                    <motion.button
                      key={perm.id}
                      whileHover={{ x: 4 }}
                      onClick={() => !isProtectedRole && handlePermissionToggle(perm.id)}
                      disabled={isProtectedRole || saving}
                      className={`px-4 py-3 rounded-lg text-left transition-all ${
                        hasPermission
                          ? 'glass bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border-neon-green/50'
                          : 'glass-hover'
                      } ${isProtectedRole || saving ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{perm.name}</p>
                          <p className="text-xs text-gray-400">{perm.action}</p>
                        </div>
                        {hasPermission ? (
                          <Check className="w-5 h-5 text-neon-green flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-600 flex-shrink-0" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
