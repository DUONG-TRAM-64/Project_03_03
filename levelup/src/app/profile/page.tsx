'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { statsAPI } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import ProgressBar from '@/components/ProgressBar';
import { PageLoader } from '@/components/LoadingSpinner';

interface ProfileData {
  user: { name: string; email: string; dailyGoal: number };
  totalHours: number;
  streak: number;
  xp: number;
  level: number;
  levelTitle: string;
  levelProgress: number;
  nextLevelXP: number;
  currentLevelXP: number;
  focusScore: number;
  pgi: number;
  consistency: number;
  badges: Array<{ name: string; icon: string; unlocked: boolean; requirement: number }>;
  completedGoals: number;
  goals: Array<{ _id: string }>;
  avgDailyHours: number;
  subjectProgress: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    actualHours: number;
  }>;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await statsAPI.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading || !data) return <PageLoader />;

  const unlockedBadges = data.badges.filter((b) => b.unlocked);
  const topSubjects = data.subjectProgress
    .sort((a, b) => b.actualHours - a.actualHours)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Profile Header */}
        <div className="card animate-slide-up">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-4xl shadow-lg shadow-primary-500/20 flex-shrink-0">
              {data.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{data.user.name}</h1>
              <p className="text-dark-400 text-sm">{data.user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs bg-primary-500/10 text-primary-400 px-2.5 py-1 rounded-full font-semibold">
                  Level {data.level} – {data.levelTitle}
                </span>
                <span className="text-xs text-dark-400">
                  {data.xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-dark-400">Level Progress</span>
              <span className="text-xs text-dark-400">
                {data.xp} / {data.nextLevelXP} XP
              </span>
            </div>
            <ProgressBar value={data.levelProgress} color="#eab308" size="md" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-slide-up">
          {[
            { label: 'Streak', value: `${data.streak} days`, icon: '🔥', color: '#f97316' },
            { label: 'Total Hours', value: `${data.totalHours}h`, icon: '⏱️', color: '#3b82f6' },
            { label: 'Focus Score', value: `${data.focusScore}/100`, icon: '🎯', color: '#8b5cf6' },
            { label: 'Consistency', value: `${data.consistency}%`, icon: '📅', color: '#6366f1' },
            { label: 'PGI', value: `${data.pgi}`, icon: '📈', color: '#10b981' },
            { label: 'Avg/Day', value: `${data.avgDailyHours}h`, icon: '📊', color: '#ec4899' },
            { label: 'Goals Done', value: `${data.completedGoals}/${data.goals.length}`, icon: '🎯', color: '#22c55e' },
            { label: 'Badges', value: `${unlockedBadges.length}/${data.badges.length}`, icon: '🏆', color: '#eab308' },
          ].map((stat) => (
            <div key={stat.label} className="card flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-dark-400">{stat.label}</p>
                <p className="text-sm font-bold text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Subjects */}
        {topSubjects.length > 0 && (
          <div className="card animate-slide-up">
            <h3 className="font-bold text-white mb-4">📚 Top Subjects</h3>
            <div className="space-y-3">
              {topSubjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    {subject.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{subject.name}</p>
                    <p className="text-xs text-dark-400">{subject.actualHours}h studied</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="card animate-slide-up">
          <h3 className="font-bold text-white mb-4">🏆 Badges Earned</h3>
          {unlockedBadges.length === 0 ? (
            <p className="text-dark-400 text-sm">No badges earned yet. Keep studying!</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {data.badges.map((badge) => (
                <div
                  key={badge.name}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                    badge.unlocked
                      ? 'bg-primary-500/10 border border-primary-500/20'
                      : 'bg-dark-700/50 opacity-40'
                  }`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[10px] font-medium text-center text-dark-300">{badge.name}</span>
                  <span className="text-[9px] text-dark-400">{badge.requirement}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="flex gap-3 animate-slide-up">
          <button
            onClick={() => router.push('/settings')}
            className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <span>⚙️</span> Settings
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            <span>📊</span> Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
