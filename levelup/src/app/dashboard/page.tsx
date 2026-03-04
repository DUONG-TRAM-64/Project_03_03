'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { statsAPI } from '@/lib/api';
import { favoritesAPI } from '@/lib/api';
import { formatDuration } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import { WeeklyChart, MonthlyChart } from '@/components/Charts';
import Heatmap from '@/components/Heatmap';
import { PageLoader } from '@/components/LoadingSpinner';
import confetti from 'canvas-confetti';

interface DashboardData {
  user: { name: string; email: string; dailyGoal: number };
  totalHours: number;
  todayHours: number;
  todayMinutes: number;
  dailyGoalMinutes: number;
  dailyGoalProgress: number;
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
  weeklyData: Array<{ date: string; hours: number }>;
  monthlyData: Array<{ date: string; hours: number }>;
  subjectProgress: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    targetHours: number;
    actualHours: number;
    progress: number;
    lastStudied: string | null;
  }>;
  badges: Array<{ name: string; icon: string; unlocked: boolean; requirement: number }>;
  goals: Array<{ _id: string; title: string; targetHours: number; reward: string; completed: boolean }>;
  completedGoals: number;
  suggestions: string[];
  avgDailyHours: number;
  heatmapData: Record<string, number>;
  moodCounts: Record<string, number>;
  favoritesSummary: {
    total: number;
    mostVisited: { name: string; icon: string; visits: number } | null;
    recent: Array<{ _id: string; name: string; icon: string; url: string }>;
  };
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState<'weekly' | 'monthly'>('weekly');

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await statsAPI.getDashboard();
      setData(result);

      // Confetti if daily goal reached
      if (result.dailyGoalProgress >= 100) {
        const prevProgress = data?.dailyGoalProgress || 0;
        if (prevProgress < 100) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#4ade80', '#facc15', '#fb923c'],
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchDashboard();
    }
  }, [user, authLoading, router, fetchDashboard]);

  if (authLoading || loading || !data) return <PageLoader />;

  const moodTotal = Object.values(data.moodCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Welcome & Suggestions */}
        <div className="animate-slide-up">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Welcome back, <span className="gradient-text">{data.user.name}</span>! 👋
          </h1>
          {data.suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              {data.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm text-dark-300 bg-primary-500/5 border border-primary-500/10 rounded-xl px-4 py-3"
                >
                  <span className="text-primary-400">💡</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Current Streak"
            value={`${data.streak} days`}
            icon="🔥"
            color="#f97316"
            subtitle={data.streak >= 7 ? 'Amazing!' : 'Keep going!'}
          />
          <StatCard
            title="Total Hours"
            value={`${data.totalHours}h`}
            icon="⏱️"
            color="#3b82f6"
          />
          <StatCard
            title="XP"
            value={data.xp.toLocaleString()}
            icon="⭐"
            color="#eab308"
            subtitle={`Level ${data.level} – ${data.levelTitle}`}
          />
          <StatCard
            title="Focus Score"
            value={data.focusScore}
            icon="🎯"
            color="#8b5cf6"
            subtitle="out of 100"
          />
        </div>

        {/* Daily Goal + Level Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Goal */}
          <div className="card animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Daily Goal</h3>
              <span className="text-sm text-dark-400">
                {formatDuration(data.todayMinutes)} / {formatDuration(data.dailyGoalMinutes)}
              </span>
            </div>
            <ProgressBar
              value={data.dailyGoalProgress}
              color={data.dailyGoalProgress >= 100 ? '#22c55e' : '#3b82f6'}
              size="lg"
            />
            {data.dailyGoalProgress >= 100 && (
              <p className="text-primary-400 text-sm mt-3 font-medium">🎉 Daily goal achieved!</p>
            )}
          </div>

          {/* Level Progress */}
          <div className="card animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">
                Level {data.level} – {data.levelTitle}
              </h3>
              <span className="text-sm text-dark-400">
                {data.xp} / {data.nextLevelXP} XP
              </span>
            </div>
            <ProgressBar
              value={data.levelProgress}
              color="#eab308"
              size="lg"
            />
            <p className="text-xs text-dark-400 mt-2">
              {data.nextLevelXP - data.xp} XP to next level
            </p>
          </div>
        </div>

        {/* PGI + Consistency */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Growth Index"
            value={data.pgi}
            icon="📈"
            color="#10b981"
            subtitle="PGI Score"
          />
          <StatCard
            title="Consistency"
            value={`${data.consistency}%`}
            icon="📅"
            color="#6366f1"
            subtitle="Last 30 days"
          />
          <StatCard
            title="Today"
            value={formatDuration(data.todayMinutes)}
            icon="📖"
            color="#22c55e"
          />
          <StatCard
            title="Avg/Day"
            value={`${data.avgDailyHours}h`}
            icon="📊"
            color="#ec4899"
            subtitle="Last 7 days"
          />
        </div>

        {/* Charts */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white">Study Activity</h3>
            <div className="flex gap-1 bg-dark-700 rounded-xl p-1">
              <button
                onClick={() => setChartTab('weekly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  chartTab === 'weekly'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartTab('monthly')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  chartTab === 'monthly'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          {chartTab === 'weekly' ? (
            <WeeklyChart data={data.weeklyData} />
          ) : (
            <MonthlyChart data={data.monthlyData} />
          )}
        </div>

        {/* Heatmap */}
        <div className="card animate-slide-up">
          <h3 className="font-bold text-white mb-4">📅 Activity Heatmap</h3>
          <Heatmap data={data.heatmapData} />
        </div>

        {/* Subject Progress */}
        <div className="card animate-slide-up">
          <h3 className="font-bold text-white mb-4">📚 Subject Progress</h3>
          {data.subjectProgress.length === 0 ? (
            <p className="text-dark-400 text-sm">No subjects yet. Add one to get started!</p>
          ) : (
            <div className="space-y-4">
              {data.subjectProgress.map((subject) => (
                <div key={subject.id} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${subject.color}20` }}
                  >
                    {subject.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {subject.name}
                      </span>
                      <span className="text-xs text-dark-400 ml-2 flex-shrink-0">
                        {subject.actualHours}h / {subject.targetHours}h
                      </span>
                    </div>
                    <ProgressBar
                      value={subject.progress}
                      color={subject.color}
                      showLabel={false}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges & Mood */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Badges */}
          <div className="card animate-slide-up">
            <h3 className="font-bold text-white mb-4">🏆 Badges</h3>
            <div className="grid grid-cols-3 gap-3">
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
                  <span className="text-[10px] font-medium text-center text-dark-300">
                    {badge.name}
                  </span>
                  <span className="text-[9px] text-dark-400">{badge.requirement}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Distribution */}
          <div className="card animate-slide-up">
            <h3 className="font-bold text-white mb-4">😊 Mood Tracker</h3>
            {moodTotal === 0 ? (
              <p className="text-dark-400 text-sm">No mood data yet. Log sessions to track your mood!</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.moodCounts).map(([mood, count]) => {
                  const emojis: Record<string, string> = {
                    great: '😀', good: '🙂', okay: '😐', tired: '😫', frustrated: '😩',
                  };
                  const percentage = moodTotal > 0 ? (count / moodTotal) * 100 : 0;
                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-xl w-8">{emojis[mood]}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-dark-300 capitalize">{mood}</span>
                          <span className="text-xs text-dark-400">{count} sessions</span>
                        </div>
                        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-700"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">🎯 Goals</h3>
            <span className="text-sm text-dark-400">
              {data.completedGoals} / {data.goals.length} completed
            </span>
          </div>
          {data.goals.length === 0 ? (
            <p className="text-dark-400 text-sm">No goals yet. Set your first goal!</p>
          ) : (
            <div className="space-y-3">
              {data.goals.map((goal) => (
                <div
                  key={goal._id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    goal.completed ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-700/30'
                  }`}
                >
                  <span className="text-xl">{goal.completed ? '✅' : '⭕'}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${goal.completed ? 'text-primary-400 line-through' : 'text-white'}`}>
                      {goal.title}
                    </p>
                    <p className="text-xs text-dark-400">{goal.targetHours}h target</p>
                  </div>
                  {goal.reward && (
                    <span className="text-xs bg-accent-500/10 text-accent-400 px-2 py-1 rounded-lg">
                      🎁 {goal.reward}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">⭐ Quick Links</h3>
            <a
              href="/favorites"
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              View all →
            </a>
          </div>
          {data.favoritesSummary.total === 0 ? (
            <div className="text-center py-6">
              <p className="text-dark-400 text-sm mb-3">No favorite websites saved yet</p>
              <a href="/favorites" className="text-sm text-primary-400 hover:text-primary-300">
                + Add your first website
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Summary Stats */}
              <div className="flex items-center justify-between p-3 bg-dark-700/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {data.favoritesSummary.total} Website{data.favoritesSummary.total !== 1 ? 's' : ''} saved
                    </p>
                    {data.favoritesSummary.mostVisited && (
                      <p className="text-xs text-dark-400">
                        Most visited: {data.favoritesSummary.mostVisited.name} ({data.favoritesSummary.mostVisited.visits} visits)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Quick Access */}
              <div className="flex flex-wrap gap-2">
                {data.favoritesSummary.recent.map((fav) => (
                  <a
                    key={fav._id}
                    href={fav.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-dark-700/50 hover:bg-dark-600/50 border border-dark-600/50 hover:border-primary-500/30 rounded-xl text-sm text-white transition-all group"
                  >
                    {fav.icon.startsWith('http') ? (
                      <img src={fav.icon} alt="" className="w-4 h-4 object-contain" />
                    ) : (
                      <span className="text-sm">{fav.icon || '🌐'}</span>
                    )}
                    <span className="group-hover:text-primary-400 transition-colors">{fav.name}</span>
                    <span className="text-dark-500 text-xs">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
