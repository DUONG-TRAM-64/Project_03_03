'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { subjectsAPI, sessionsAPI, goalsAPI } from '@/lib/api';
import { formatDuration, moodEmojis } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import Timer from '@/components/Timer';
import Modal from '@/components/Modal';
import { PageLoader } from '@/components/LoadingSpinner';
import confetti from 'canvas-confetti';

interface SubjectOption {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface SessionData {
  _id: string;
  subjectId: { _id: string; name: string; icon: string; color: string } | null;
  date: string;
  duration: number;
  note: string;
  mood: string;
}

export default function TrackingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  // Timer state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [tab, setTab] = useState<'timer' | 'manual'>('timer');

  // Manual entry
  const [manualSubject, setManualSubject] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDuration, setManualDuration] = useState(30);
  const [manualNote, setManualNote] = useState('');
  const [manualMood, setManualMood] = useState('good');
  const [saving, setSaving] = useState(false);

  // Add Session modal
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addSubject, setAddSubject] = useState('');
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0]);
  const [addDuration, setAddDuration] = useState(30);
  const [addNote, setAddNote] = useState('');
  const [addMood, setAddMood] = useState('good');
  const [addSaving, setAddSaving] = useState(false);

  // Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(10);
  const [goalReward, setGoalReward] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [subData, sesData] = await Promise.all([
        subjectsAPI.getAll(),
        sessionsAPI.getAll({ limit: 20 }),
      ]);
      setSubjects(subData.subjects);
      setSessions(sesData.sessions);
      if (subData.subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(subData.subjects[0]._id);
        setManualSubject(subData.subjects[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const handleTimerComplete = async (minutes: number) => {
    if (!selectedSubject) return;
    setSaving(true);
    try {
      await sessionsAPI.create({
        subjectId: selectedSubject,
        duration: minutes,
        mood: 'good',
      });
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#4ade80'],
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save timer session:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSubject || manualDuration < 1) return;
    setSaving(true);
    try {
      await sessionsAPI.create({
        subjectId: manualSubject,
        date: manualDate,
        duration: manualDuration,
        note: manualNote,
        mood: manualMood,
      });
      setManualNote('');
      setManualDuration(30);
      confetti({
        particleCount: 40,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#4ade80'],
      });
      fetchData();
    } catch (error) {
      console.error('Failed to save manual session:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSession = async () => {
    if (!addSubject || addDuration < 1) return;
    setAddSaving(true);
    try {
      await sessionsAPI.create({
        subjectId: addSubject,
        date: addDate,
        duration: addDuration,
        note: addNote,
        mood: addMood,
      });
      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#60A5FA'],
      });
      // Reset & close
      setAddSessionOpen(false);
      setAddNote('');
      setAddDuration(30);
      setAddMood('good');
      setAddDate(new Date().toISOString().split('T')[0]);
      fetchData();
    } catch (error) {
      console.error('Failed to add session:', error);
    } finally {
      setAddSaving(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await sessionsAPI.delete(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle || goalTarget < 1) return;
    try {
      await goalsAPI.create({ title: goalTitle, targetHours: goalTarget, reward: goalReward });
      setGoalModalOpen(false);
      setGoalTitle('');
      setGoalTarget(10);
      setGoalReward('');
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  };

  if (authLoading || loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-8">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-bold text-white">⏱️ Study Tracking</h1>
            <p className="text-dark-400 text-sm mt-1">Log your study sessions</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (subjects.length > 0 && !addSubject) setAddSubject(subjects[0]._id);
                setAddSessionOpen(true);
              }}
              className="btn-primary text-sm"
            >
              + Add Session
            </button>
            <button onClick={() => setGoalModalOpen(true)} className="btn-secondary text-sm">
              + New Goal
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab('timer')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'timer'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            ⏱️ Timer
          </button>
          <button
            onClick={() => setTab('manual')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'manual'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            ✍️ Manual
          </button>
        </div>

        {/* Timer Mode */}
        {tab === 'timer' && (
          <div className="card animate-fade-in">
            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-dark-400">Create a subject first to start tracking!</p>
              </div>
            ) : (
              <>
                {/* Subject Selector */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    What are you studying?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <button
                        key={subject._id}
                        onClick={() => !timerRunning && setSelectedSubject(subject._id)}
                        disabled={timerRunning}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          selectedSubject === subject._id
                            ? 'border-2 shadow-lg'
                            : 'bg-dark-700 hover:bg-dark-600 border-2 border-transparent'
                        } ${timerRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={
                          selectedSubject === subject._id
                            ? {
                                backgroundColor: `${subject.color}15`,
                                borderColor: subject.color,
                                color: subject.color,
                              }
                            : {}
                        }
                      >
                        <span>{subject.icon}</span>
                        <span>{subject.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Timer */}
                <Timer
                  onComplete={handleTimerComplete}
                  isRunning={timerRunning}
                  onToggle={() => setTimerRunning(!timerRunning)}
                  onReset={() => setTimerRunning(false)}
                />
              </>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {tab === 'manual' && (
          <div className="card animate-fade-in">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Subject</label>
                <select
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="input-field"
                    min={1}
                    max={1440}
                    required
                  />
                </div>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  How did you feel?
                </label>
                <div className="flex gap-2">
                  {Object.entries(moodEmojis).map(([key, emoji]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setManualMood(key)}
                      className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all ${
                        manualMood === key
                          ? 'bg-primary-500/20 border-2 border-primary-500 scale-105'
                          : 'bg-dark-700 border-2 border-transparent hover:bg-dark-600'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-[10px] text-dark-400 capitalize">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="What did you learn today?"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✨ Log Session'}
              </button>
            </form>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="card animate-slide-up">
          <h3 className="font-bold text-white mb-4">📋 Recent Sessions</h3>
          {sessions.length === 0 ? (
            <p className="text-dark-400 text-sm">No sessions yet. Start studying!</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-3 p-3 bg-dark-700/30 rounded-xl group"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{
                      backgroundColor: session.subjectId
                        ? `${session.subjectId.color}20`
                        : '#33333320',
                    }}
                  >
                    {session.subjectId?.icon || '📚'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {session.subjectId?.name || 'Unknown'}
                      </span>
                      {session.mood && (
                        <span className="text-sm">
                          {moodEmojis[session.mood] || ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dark-400">
                      {new Date(session.date).toLocaleDateString()} · {formatDuration(session.duration)}
                      {session.note && ` · ${session.note}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session._id)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-red-400 hover:bg-dark-600 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Session Modal */}
      <Modal
        isOpen={addSessionOpen}
        onClose={() => setAddSessionOpen(false)}
        title="📝 Add Study Session"
      >
        <p className="text-sm text-dark-400 mb-4">
          Forgot to start the timer? Log your session manually.
        </p>
        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Subject</label>
            <select
              value={addSubject}
              onChange={(e) => setAddSubject(e.target.value)}
              className="input-field"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
              <input
                type="date"
                value={addDate}
                onChange={(e) => setAddDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Duration (min)</label>
              <input
                type="number"
                value={addDuration}
                onChange={(e) => setAddDuration(Number(e.target.value))}
                className="input-field"
                min={1}
                max={1440}
              />
            </div>
          </div>

          {/* Quick Duration Presets */}
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60, 90, 120].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setAddDuration(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  addDuration === m
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                    : 'bg-dark-700 text-dark-400 hover:text-white hover:bg-dark-600'
                }`}
              >
                {m >= 60 ? `${m / 60}h` : `${m}m`}
              </button>
            ))}
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Mood</label>
            <div className="flex gap-2">
              {Object.entries(moodEmojis).map(([key, emoji]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAddMood(key)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-sm ${
                    addMood === key
                      ? 'bg-primary-500/20 border-2 border-primary-500 scale-105'
                      : 'bg-dark-700 border-2 border-transparent hover:bg-dark-600'
                  }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-[10px] text-dark-400 capitalize">{key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Note (optional)</label>
            <textarea
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="What did you study?"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddSessionOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleAddSession}
              disabled={!addSubject || addDuration < 1 || addSaving}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {addSaving ? 'Saving...' : '✨ Save Session'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Goal Modal */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="New Goal"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Goal Title</label>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Complete 100 hours of coding"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Target Hours</label>
            <input
              type="number"
              value={goalTarget}
              onChange={(e) => setGoalTarget(Number(e.target.value))}
              className="input-field"
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Reward (optional)</label>
            <input
              type="text"
              value={goalReward}
              onChange={(e) => setGoalReward(e.target.value)}
              className="input-field"
              placeholder="e.g. Buy a new book"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setGoalModalOpen(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleCreateGoal}
              disabled={!goalTitle.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Create Goal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
