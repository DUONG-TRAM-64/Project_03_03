import { startOfDay, subDays, format, differenceInCalendarDays, parseISO } from 'date-fns';

// XP Formula: 1 hour = 10 XP
export function calculateXP(totalMinutes: number): number {
  return Math.floor((totalMinutes / 60) * 10);
}

// Bonus XP for streaks
export function calculateStreakBonus(streak: number): number {
  if (streak >= 30) return 200;
  if (streak >= 14) return 100;
  if (streak >= 7) return 50;
  if (streak >= 3) return 20;
  return 0;
}

// Level = floor(sqrt(totalXP / 50))
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50));
}

// Get level title
export function getLevelTitle(level: number): string {
  if (level >= 20) return 'Grandmaster';
  if (level >= 15) return 'Master';
  if (level >= 10) return 'Expert';
  if (level >= 7) return 'Advanced';
  if (level >= 5) return 'Intermediate';
  if (level >= 3) return 'Apprentice';
  if (level >= 1) return 'Beginner';
  return 'Newcomer';
}

// XP needed for next level
export function xpForLevel(level: number): number {
  return (level + 1) * (level + 1) * 50;
}

// Calculate streak from session dates
export function calculateStreak(sessionDates: Date[]): number {
  if (sessionDates.length === 0) return 0;

  const uniqueDays = new Set(
    sessionDates.map((d) => format(startOfDay(new Date(d)), 'yyyy-MM-dd'))
  );

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const yesterday = format(startOfDay(subDays(new Date(), 1)), 'yyyy-MM-dd');

  // Streak must include today or yesterday
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const current = parseISO(sortedDays[i - 1]);
    const previous = parseISO(sortedDays[i]);
    const diff = differenceInCalendarDays(current, previous);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Get badge based on total hours
export function getBadges(totalHours: number): Array<{ name: string; icon: string; unlocked: boolean; requirement: number }> {
  return [
    { name: 'First Step', icon: '👶', unlocked: totalHours >= 1, requirement: 1 },
    { name: 'Getting Started', icon: '🌱', unlocked: totalHours >= 5, requirement: 5 },
    { name: 'Beginner', icon: '📗', unlocked: totalHours >= 10, requirement: 10 },
    { name: 'Committed', icon: '💪', unlocked: totalHours >= 25, requirement: 25 },
    { name: 'Dedicated', icon: '🔥', unlocked: totalHours >= 50, requirement: 50 },
    { name: 'Scholar', icon: '📚', unlocked: totalHours >= 100, requirement: 100 },
    { name: 'Expert', icon: '🎓', unlocked: totalHours >= 250, requirement: 250 },
    { name: 'Master', icon: '🏆', unlocked: totalHours >= 500, requirement: 500 },
    { name: 'Legend', icon: '👑', unlocked: totalHours >= 1000, requirement: 1000 },
  ];
}

// Focus Score = (actual / planned) * streak weight
export function calculateFocusScore(actualHours: number, plannedHours: number, streak: number): number {
  if (plannedHours === 0) return 0;
  const ratio = Math.min(actualHours / plannedHours, 1.5);
  const streakWeight = 1 + Math.min(streak * 0.02, 0.5);
  return Math.min(Math.round(ratio * streakWeight * 100), 100);
}

// Personal Growth Index
export function calculatePGI(totalHours: number, streak: number, goalsCompleted: number, consistency: number): number {
  const hoursScore = Math.min(totalHours / 100, 1) * 25;
  const streakScore = Math.min(streak / 30, 1) * 25;
  const goalsScore = Math.min(goalsCompleted / 10, 1) * 25;
  const consistencyScore = consistency * 25;
  return Math.round(hoursScore + streakScore + goalsScore + consistencyScore);
}

// Smart suggestion
export function getSmartSuggestions(
  subjects: Array<{ name: string; lastStudied: Date | null; targetHours: number; actualHours: number }>
): string[] {
  const suggestions: string[] = [];
  const now = new Date();

  for (const subject of subjects) {
    if (!subject.lastStudied) {
      suggestions.push(`You haven't started "${subject.name}" yet. Begin today!`);
      continue;
    }

    const daysSince = differenceInCalendarDays(now, new Date(subject.lastStudied));

    if (daysSince >= 3) {
      suggestions.push(`You haven't studied "${subject.name}" for ${daysSince} days. Time to review!`);
    }

    const remaining = subject.targetHours - subject.actualHours;
    if (remaining > 0 && remaining <= 2) {
      suggestions.push(`"${subject.name}" is almost complete! Only ${remaining.toFixed(1)}h left.`);
    }
  }

  return suggestions.slice(0, 3);
}

// Estimated completion date
export function estimateCompletion(remainingHours: number, avgDailyHours: number): Date | null {
  if (avgDailyHours <= 0) return null;
  const daysNeeded = Math.ceil(remainingHours / avgDailyHours);
  return new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000);
}

// Format duration
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Mood emoji map
export const moodEmojis: Record<string, string> = {
  great: '😀',
  good: '🙂',
  okay: '😐',
  tired: '😫',
  frustrated: '😩',
};
