'use client';

import React from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useRouter } from 'next/navigation';
import { Menu, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-white/10 glass sticky top-0 z-40">
      <div className="h-16 px-4 lg:px-8 flex items-center justify-between">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 glass-hover rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer */}
        <div className="hidden lg:block" />

        {/* User Menu */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 glass-hover rounded-lg flex items-center gap-2"
            >
              <User className="w-5 h-5" />
            </button>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 glass rounded-xl overflow-hidden shadow-xl"
              >
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center gap-2 text-neon-pink"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
