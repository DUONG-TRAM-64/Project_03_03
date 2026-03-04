'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/subjects', label: 'Subjects', icon: '📚' },
  { href: '/tracking', label: 'Track', icon: '⏱️' },
  { href: '/favorites', label: 'Favorites', icon: '⭐' },
];

function ThemeDropdown() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const options = [
    { key: 'light' as const, label: 'Light', icon: '🌞' },
    { key: 'dark' as const, label: 'Dark', icon: '🌙' },
    { key: 'system' as const, label: 'System', icon: '🖥️' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:bg-dark-700/50 transition-all duration-200 active:scale-95"
        title="Toggle theme"
      >
        {resolvedTheme === 'dark' ? '🌙' : '☀️'}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-40 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden animate-scale-in z-50">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setTheme(opt.key); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                theme === opt.key
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-dark-300 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <span>{opt.icon}</span>
              <span className="font-medium">{opt.label}</span>
              {theme === opt.key && <span className="ml-auto text-primary-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems = [
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-primary-500/20 border border-purple-500/30 flex items-center justify-center text-sm hover:border-purple-400/50 transition-all duration-200 active:scale-95"
        title="Account"
      >
        <span className="text-lg">👤</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden animate-scale-in z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-dark-700">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-dark-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-primary-500/10 text-primary-400 px-2 py-0.5 rounded-full font-medium">
                Level {user?.level || 0}
              </span>
              <span className="text-xs text-dark-400">
                {user?.xp?.toLocaleString() || 0} XP
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:bg-dark-700 hover:text-white transition-all"
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-dark-700 py-1">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span>🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
        <div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold gradient-text">LevelUp</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                    : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeDropdown />
            <UserDropdown />
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                pathname === item.href
                  ? 'text-primary-400'
                  : 'text-dark-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
          {/* Mobile: Theme & Profile icons */}
          <Link
            href="/settings"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
              pathname === '/settings' || pathname === '/profile'
                ? 'text-primary-400'
                : 'text-dark-400'
            }`}
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px] font-medium">More</span>
          </Link>
        </div>
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-16" />
      <div className="md:hidden h-0" />
    </>
  );
}
