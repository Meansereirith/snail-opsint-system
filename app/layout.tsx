'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUser, isLoading } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <html lang="en">
        <body className="bg-dark-900 text-white">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse">
              <div className="h-12 w-12 rounded-full border-4 border-neon-blue border-t-neon-purple border-r-neon-pink"></div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="bg-dark-900 text-white">
        {children}
      </body>
    </html>
  );
}
