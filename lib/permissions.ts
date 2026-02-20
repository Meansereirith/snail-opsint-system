import { supabase, User, Role, Permission, RolePermission } from './supabase';

let cachedPermissions: { [userId: string]: Permission[] } = {};
let cachedRoles: { [roleId: string]: Role } = {};

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    // Check cache
    if (cachedPermissions[userId]) {
      return cachedPermissions[userId];
    }

    // Get user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(name)')
      .eq('id', userId)
      .single();

    if (userError || !userData) return [];

    // CEO and Admin have all permissions
    if ((userData.roles as any)?.name === 'CEO' || (userData.roles as any)?.name === 'Admin') {
      const { data: allPerms } = await supabase.from('permissions').select('*');
      cachedPermissions[userId] = allPerms || [];
      return allPerms || [];
    }

    // Get role permissions
    const { data: rolePerms, error: permsError } = await supabase
      .from('role_permissions')
      .select('permissions(id, name, description, resource, action)')
      .eq('role_id', userData.role_id);

    if (permsError || !rolePerms) return [];

    const permissions = rolePerms
      .map((rp: any) => rp.permissions)
      .filter(Boolean);

    cachedPermissions[userId] = permissions;
    return permissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const permissions = await getUserPermissions(userId);
    return permissions.some(p => p.resource === resource && p.action === action);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('users')
      .select('roles(name)')
      .eq('id', userId)
      .single();

    if (!data) return false;
    const roleName = (data.roles as any)?.name;
    return roleName === 'CEO' || roleName === 'Admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function getRole(roleId: string): Promise<Role | null> {
  try {
    if (cachedRoles[roleId]) {
      return cachedRoles[roleId];
    }

    const { data } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (data) {
      cachedRoles[roleId] = data;
    }
    return data || null;
  } catch (error) {
    console.error('Error fetching role:', error);
    return null;
  }
}

export function invalidateCache(userId?: string) {
  if (userId) {
    delete cachedPermissions[userId];
  } else {
    cachedPermissions = {};
  }
}
