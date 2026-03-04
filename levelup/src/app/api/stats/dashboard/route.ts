import { NextRequest, NextResponse } from 'next/server';
import { findAll, findById, updateOne } from '@/lib/store';
import { getUserFromRequest } from '@/lib/auth';
import {
  calculateStreak, calculateXP, calculateLevel, calculateFocusScore,
  calculatePGI, getBadges, getSmartSuggestions, getLevelTitle, xpForLevel,
  calculateStreakBonus,
} from '@/lib/utils';
import { startOfDay, subDays, format } from 'date-fns';

interface UserDoc { _id: string; name: string; email: string; passwordHash: string; dailyGoal: number; level: number; xp: number; }
interface SessionDoc { _id: string; userId: string; subjectId: string; date: string; duration: number; note: string; mood: string; }
interface SubjectDoc { _id: string; userId: string; name: string; icon: string; color: string; targetHours: number; archived: boolean; }
interface GoalDoc { _id: string; userId: string; title: string; targetHours: number; reward: string; completed: boolean; completedAt: string | null; }
interface FavoriteDoc { _id: string; userId: string; name: string; url: string; icon: string; visitCount: number; lastVisited: string | null; }

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = findById<UserDoc>('users', payload.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const allSessions = findAll<SessionDoc>('sessions')
      .filter((s) => s.userId === payload.userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalMinutes = allSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = Number((totalMinutes / 60).toFixed(2));

    const todayStart = startOfDay(new Date());
    const todaySessions = allSessions.filter((s) => new Date(s.date) >= todayStart);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const todayHours = Number((todayMinutes / 60).toFixed(2));

    const sessionDates = allSessions.map((s) => new Date(s.date));
    const streak = calculateStreak(sessionDates);

    const streakBonus = calculateStreakBonus(streak);
    const baseXP = calculateXP(totalMinutes);
    const totalXP = baseXP + streakBonus;
    const level = calculateLevel(totalXP);
    const levelTitle = getLevelTitle(level);
    const nextLevelXP = xpForLevel(level);
    const currentLevelXP = level > 0 ? xpForLevel(level - 1) : 0;
    const levelProgress = nextLevelXP > currentLevelXP ? ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 : 0;

    updateOne<UserDoc>('users', payload.userId, { xp: totalXP, level } as any);

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const dayMinutes = allSessions.filter((s) => { const d = new Date(s.date); return d >= dayStart && d < dayEnd; }).reduce((sum, s) => sum + s.duration, 0);
      weeklyData.push({ date: format(day, 'EEE'), fullDate: format(day, 'yyyy-MM-dd'), hours: Number((dayMinutes / 60).toFixed(2)), minutes: dayMinutes });
    }

    const monthlyData = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const dayMinutes = allSessions.filter((s) => { const d = new Date(s.date); return d >= dayStart && d < dayEnd; }).reduce((sum, s) => sum + s.duration, 0);
      monthlyData.push({ date: format(day, 'dd/MM'), hours: Number((dayMinutes / 60).toFixed(2)) });
    }

    const subjects = findAll<SubjectDoc>('subjects').filter((s) => s.userId === payload.userId && !s.archived);
    const subjectProgress = subjects.map((subject) => {
      const subSessions = allSessions.filter((s) => s.subjectId === subject._id);
      const subMinutes = subSessions.reduce((sum, s) => sum + s.duration, 0);
      const subHours = Number((subMinutes / 60).toFixed(2));
      const progress = subject.targetHours > 0 ? Math.min((subHours / subject.targetHours) * 100, 100) : 0;
      const lastSession = subSessions.length > 0 ? subSessions[0].date : null;
      return { id: subject._id, name: subject.name, icon: subject.icon, color: subject.color, targetHours: subject.targetHours, actualHours: subHours, progress: Number(progress.toFixed(1)), lastStudied: lastSession };
    });

    const goals = findAll<GoalDoc>('goals').filter((g) => g.userId === payload.userId);
    const completedGoals = goals.filter((g) => g.completed).length;
    const badges = getBadges(totalHours);

    const dailyGoalHours = (user.dailyGoal || 60) / 60;
    const focusScore = calculateFocusScore(todayHours, dailyGoalHours, streak);

    const last30DaysStudied = new Set(
      allSessions.filter((s) => new Date(s.date) >= subDays(new Date(), 30)).map((s) => format(new Date(s.date), 'yyyy-MM-dd'))
    ).size;
    const consistency = last30DaysStudied / 30;
    const pgi = calculatePGI(totalHours, streak, completedGoals, consistency);

    const suggestions = getSmartSuggestions(
      subjectProgress.map((s) => ({ name: s.name, lastStudied: s.lastStudied ? new Date(s.lastStudied) : null, targetHours: s.targetHours, actualHours: s.actualHours }))
    );

    const weekTotalMinutes = weeklyData.reduce((sum, d) => sum + d.minutes, 0);
    const avgDailyHours = weekTotalMinutes / (7 * 60);

    const heatmapData: Record<string, number> = {};
    for (let i = 364; i >= 0; i--) { heatmapData[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0; }
    allSessions.forEach((s) => { const k = format(new Date(s.date), 'yyyy-MM-dd'); if (heatmapData[k] !== undefined) heatmapData[k] += s.duration; });

    const moodCounts: Record<string, number> = { great: 0, good: 0, okay: 0, tired: 0, frustrated: 0 };
    allSessions.forEach((s) => { if (s.mood && moodCounts[s.mood] !== undefined) moodCounts[s.mood]++; });

    // Favorites summary
    const allFavorites = findAll<FavoriteDoc>('favorites').filter((f) => f.userId === payload.userId);
    const mostVisited = allFavorites.length > 0
      ? [...allFavorites].sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0))[0]
      : null;
    const favoritesSummary = {
      total: allFavorites.length,
      mostVisited: mostVisited ? { name: mostVisited.name, icon: mostVisited.icon, visits: mostVisited.visitCount } : null,
      recent: allFavorites.slice(0, 5).map((f) => ({ _id: f._id, name: f.name, icon: f.icon, url: f.url })),
    };

    return NextResponse.json({
      user: { name: user.name, email: user.email, dailyGoal: user.dailyGoal || 60 },
      totalHours, todayHours, todayMinutes, dailyGoalMinutes: user.dailyGoal || 60,
      dailyGoalProgress: Math.min((todayMinutes / (user.dailyGoal || 60)) * 100, 100),
      streak, xp: totalXP, level, levelTitle, levelProgress: Number(levelProgress.toFixed(1)),
      nextLevelXP, currentLevelXP, focusScore, pgi,
      consistency: Number((consistency * 100).toFixed(1)),
      weeklyData, monthlyData, subjectProgress, badges, goals, completedGoals,
      suggestions, avgDailyHours: Number(avgDailyHours.toFixed(2)), heatmapData, moodCounts,
      favoritesSummary,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
