'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authAPI } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { PageLoader } from '@/components/LoadingSpinner';

type Tab = 'general' | 'study' | 'appearance' | 'security';

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: '👤' },
  { key: 'study', label: 'Study', icon: '📖' },
  { key: 'appearance', label: 'Appearance', icon: '🎨' },
  { key: 'security', label: 'Security', icon: '🔒' },
];

const PRIMARY_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Teal', value: '#2CB1BC' },
  { name: 'Purple', value: '#9B51E0' },
  { name: 'Green', value: '#27AE60' },
  { name: 'Red', value: '#EB5757' },
  { name: 'Yellow', value: '#F2C94C' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
];

export default function SettingsPage() {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  // General
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Study
  const [dailyGoal, setDailyGoal] = useState(60);
  const [studySaving, setStudySaving] = useState(false);
  const [studyMsg, setStudyMsg] = useState('');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  // Delete account
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#22c55e');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      setName(user.name);
      setDailyGoal(user.dailyGoal || 60);
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const saved = localStorage.getItem('primaryColor');
    if (saved) setPrimaryColor(saved);
  }, []);

  const handleSaveGeneral = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await authAPI.updateProfile({ name: name.trim() });
      await refreshUser();
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (error: any) {
      setSaveMsg(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStudy = async () => {
    setStudySaving(true);
    setStudyMsg('');
    try {
      await authAPI.updateProfile({ dailyGoal });
      await refreshUser();
      setStudyMsg('Study settings saved!');
      setTimeout(() => setStudyMsg(''), 3000);
    } catch (error: any) {
      setStudyMsg(`Error: ${error.message}`);
    } finally {
      setStudySaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwMsg('');
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      setPwMsg('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (error: any) {
      setPwError(error.message);
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    setDeleting(true);
    try {
      await authAPI.deleteAccount({ password: deletePassword });
      logout();
      router.replace('/login');
    } catch (error: any) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handlePrimaryColor = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem('primaryColor', color);
    // Apply CSS custom property overrides (Tailwind theme + design tokens)
    document.documentElement.style.setProperty('--color-primary-500', color);
    document.documentElement.style.setProperty('--color-primary-400', `color-mix(in srgb, ${color} 80%, white)`);
    document.documentElement.style.setProperty('--color-primary-600', `color-mix(in srgb, ${color} 80%, black)`);
    // Update design token brand colors
    document.documentElement.style.setProperty('--brand-primary', color);
    document.documentElement.style.setProperty('--brand-primary-light', `color-mix(in srgb, ${color} 75%, white)`);
    document.documentElement.style.setProperty('--brand-primary-dark', `color-mix(in srgb, ${color} 85%, black)`);
    // Update gradient & shadow tokens
    document.documentElement.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 80%, black))`);
    document.documentElement.style.setProperty('--gradient-text', `linear-gradient(to right, color-mix(in srgb, ${color} 80%, white), ${color})`);
    document.documentElement.style.setProperty('--shadow-primary', `0 10px 15px -3px color-mix(in srgb, ${color} 25%, transparent)`);
    document.documentElement.style.setProperty('--border-hover', `color-mix(in srgb, ${color} 30%, transparent)`);
  };

  // Apply saved primary color on mount
  useEffect(() => {
    const saved = localStorage.getItem('primaryColor');
    if (saved && saved !== '#3B82F6') {
      handlePrimaryColor(saved);
    }
  }, []);

  if (authLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>
          <p className="text-dark-400 text-sm mt-1">Manage your account and preferences</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="card animate-fade-in space-y-5">
            <h3 className="font-bold text-white">👤 Profile Information</h3>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className="input-field opacity-50 cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-dark-500 mt-1">Email cannot be changed</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMsg && (
                <span className={`text-sm ${saveMsg.startsWith('Error') ? 'text-red-400' : 'text-primary-400'}`}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Study Tab */}
        {activeTab === 'study' && (
          <div className="card animate-fade-in space-y-5">
            <h3 className="font-bold text-white">📖 Study Preferences</h3>

            {/* Daily Goal */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Daily Study Goal (minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={480}
                  step={5}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="flex-1 accent-primary-500"
                />
                <div className="w-20 text-center">
                  <input
                    type="number"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Math.max(10, Math.min(480, Number(e.target.value))))}
                    className="input-field text-center text-sm py-1.5"
                    min={10}
                    max={480}
                  />
                </div>
              </div>
              <p className="text-xs text-dark-500 mt-1">
                {Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m per day
              </p>
            </div>

            {/* Preset Goals */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {[30, 60, 90, 120, 180, 240].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setDailyGoal(mins)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      dailyGoal === mins
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                    }`}
                  >
                    {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveStudy}
                disabled={studySaving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {studySaving ? 'Saving...' : 'Save Study Settings'}
              </button>
              {studyMsg && (
                <span className={`text-sm ${studyMsg.startsWith('Error') ? 'text-red-400' : 'text-primary-400'}`}>
                  {studyMsg}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="card animate-fade-in space-y-5">
            <h3 className="font-bold text-white">🎨 Appearance</h3>

            {/* Theme Mode */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Theme Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { key: 'light' as const, icon: '🌞', label: 'Light', desc: 'Bright background' },
                  { key: 'dark' as const, icon: '🌙', label: 'Dark', desc: 'Easy on the eyes' },
                  { key: 'system' as const, icon: '🖥️', label: 'System', desc: 'Match your OS' },
                ]).map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTheme(opt.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${
                      theme === opt.key
                        ? 'bg-primary-500/10 border-primary-500 scale-[1.02]'
                        : 'bg-dark-700/50 border-transparent hover:bg-dark-700 hover:border-dark-600'
                    }`}
                  >
                    <span className="text-3xl">{opt.icon}</span>
                    <span className="text-sm font-semibold text-white">{opt.label}</span>
                    <span className="text-[10px] text-dark-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3">Primary Color</label>
              <div className="flex flex-wrap gap-3">
                {PRIMARY_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handlePrimaryColor(c.value)}
                    className={`w-12 h-12 rounded-2xl transition-all duration-200 flex items-center justify-center ${
                      primaryColor === c.value
                        ? 'ring-2 ring-offset-2 ring-offset-dark-800 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: c.value,
                      boxShadow: primaryColor === c.value ? `0 0 0 2px var(--color-dark-800), 0 0 0 4px ${c.value}` : undefined,
                    }}
                    title={c.name}
                  >
                    {primaryColor === c.value && <span className="text-white text-sm">✓</span>}
                  </button>
                ))}
              </div>
              <p className="text-xs text-dark-500 mt-2">
                Color changes apply immediately. Refresh for full effect.
              </p>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4 animate-fade-in">
            {/* Change Password */}
            <div className="card space-y-4">
              <h3 className="font-bold text-white">🔑 Change Password</h3>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder="Confirm new password"
                />
              </div>

              {pwError && <p className="text-sm text-red-400">{pwError}</p>}
              {pwMsg && <p className="text-sm text-primary-400">{pwMsg}</p>}

              <button
                onClick={handleChangePassword}
                disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {pwSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="card border border-red-500/20 space-y-4">
              <h3 className="font-bold text-red-400">⚠️ Danger Zone</h3>
              <p className="text-sm text-dark-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="btn-danger text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletePassword(''); setDeleteError(''); }}
        title="⚠️ Delete Account"
      >
        <div className="space-y-4">
          <p className="text-dark-300 text-sm">
            This will permanently delete your account and all your data (sessions, subjects, goals, favorites).
            This action <strong className="text-red-400">cannot be undone</strong>.
          </p>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="input-field"
              placeholder="Your password"
            />
          </div>
          {deleteError && <p className="text-sm text-red-400">{deleteError}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setDeleteModalOpen(false); setDeletePassword(''); setDeleteError(''); }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting || !deletePassword}
              className="btn-danger flex-1 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
