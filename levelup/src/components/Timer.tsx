'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TimerProps {
  onComplete: (durationMinutes: number) => void;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

const PRESETS = [25, 45, 60, 90, 120];
const STEP = 5;
const MIN_MINUTES = 5;
const MAX_MINUTES = 240;

export default function Timer({ onComplete, isRunning, onToggle, onReset }: TimerProps) {
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>('countdown');
  const [seconds, setSeconds] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState(25);
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('timer_session');
    if (saved) {
      const { startTime, accumulated, timerMode, target } = JSON.parse(saved);
      if (timerMode) setMode(timerMode);
      if (target) setTargetMinutes(target);
      if (startTime) {
        startTimeRef.current = startTime;
        const elapsed = Math.floor((Date.now() - startTime) / 1000) + accumulated;
        setSeconds(elapsed);
      }
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      localStorage.setItem('timer_session', JSON.stringify({
        startTime: startTimeRef.current,
        accumulated: seconds,
        timerMode: mode,
        target: targetMinutes,
      }));

      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1;
          // Auto-complete when countdown finishes
          if (mode === 'countdown' && next >= targetMinutes * 60) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            return targetMinutes * 60;
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (seconds > 0) {
        localStorage.setItem('timer_session', JSON.stringify({
          startTime: null,
          accumulated: seconds,
          timerMode: mode,
          target: targetMinutes,
        }));
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, targetMinutes]);

  // Auto-trigger completion for countdown
  useEffect(() => {
    if (mode === 'countdown' && seconds >= targetMinutes * 60 && isRunning) {
      handleStop();
    }
  }, [seconds, mode, targetMinutes, isRunning]);

  const handleStop = useCallback(() => {
    const elapsed = seconds;
    if (elapsed >= 60) {
      const minutes = Math.round(elapsed / 60);
      onComplete(minutes);
    }
    setSeconds(0);
    startTimeRef.current = null;
    localStorage.removeItem('timer_session');
    onReset();
  }, [seconds, onComplete, onReset]);

  const handlePreset = (minutes: number) => {
    if (isRunning) return;
    setTargetMinutes(minutes);
    setMode('countdown');
    setSeconds(0);
  };

  const handleAdjust = (delta: number) => {
    if (isRunning) return;
    setTargetMinutes((prev) => {
      const next = prev + delta;
      return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, next));
    });
    setMode('countdown');
    setSeconds(0);
  };

  const handleCustomSubmit = () => {
    const val = parseInt(customInput, 10);
    if (!isNaN(val) && val >= MIN_MINUTES && val <= MAX_MINUTES) {
      setTargetMinutes(val);
      setMode('countdown');
      setSeconds(0);
    }
    setIsEditing(false);
    setCustomInput('');
  };

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalTarget = mode === 'countdown' ? targetMinutes * 60 : 3600;
  const displaySeconds = mode === 'countdown' ? Math.max(targetMinutes * 60 - seconds, 0) : seconds;

  // Update browser tab title with timer
  useEffect(() => {
    if (isRunning || seconds > 0) {
      const timeStr = formatTime(displaySeconds);
      const label = mode === 'countdown' ? '⏳' : '⏱️';
      const status = isRunning ? (mode === 'countdown' ? 'Focus' : 'Studying') : 'Paused';
      document.title = `${label} ${timeStr} – ${status} | LevelUp`;
    } else {
      document.title = 'LevelUp – Study Tracking';
    }
    return () => {
      document.title = 'LevelUp – Personal Learning Tracker';
    };
  }, [seconds, isRunning, displaySeconds, mode]);
  const progress = mode === 'countdown'
    ? Math.min((seconds / (targetMinutes * 60)) * 100, 100)
    : Math.min((seconds / 3600) * 100, 100);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mode Toggle */}
      <div className="flex gap-1 bg-dark-700 rounded-xl p-1">
        <button
          onClick={() => !isRunning && setMode('countdown')}
          disabled={isRunning}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'countdown'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white'
          } ${isRunning ? 'cursor-not-allowed' : ''}`}
        >
          ⏳ Countdown
        </button>
        <button
          onClick={() => !isRunning && setMode('stopwatch')}
          disabled={isRunning}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'stopwatch'
              ? 'bg-primary-500 text-white'
              : 'text-dark-400 hover:text-white'
          } ${isRunning ? 'cursor-not-allowed' : ''}`}
        >
          ⏱️ Stopwatch
        </button>
      </div>

      {/* Preset Time Selector (Countdown mode) */}
      {mode === 'countdown' && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {PRESETS.map((mins) => (
              <button
                key={mins}
                onClick={() => handlePreset(mins)}
                disabled={isRunning}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  targetMinutes === mins && !isEditing
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 scale-105'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {mins}m
              </button>
            ))}
          </div>

          {/* +/- Controls & Custom Input */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAdjust(-STEP)}
              disabled={isRunning || targetMinutes <= MIN_MINUTES}
              className="w-10 h-10 rounded-full bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white flex items-center justify-center text-lg font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              −
            </button>

            {isEditing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCustomSubmit();
                }}
                className="flex items-center"
              >
                <input
                  type="number"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="w-20 text-center bg-dark-700 border border-primary-500 rounded-xl py-2 text-white text-sm font-bold focus:outline-none"
                  min={MIN_MINUTES}
                  max={MAX_MINUTES}
                  autoFocus
                  onBlur={handleCustomSubmit}
                  placeholder="min"
                />
              </form>
            ) : (
              <button
                onClick={() => {
                  if (!isRunning) {
                    setIsEditing(true);
                    setCustomInput(String(targetMinutes));
                  }
                }}
                disabled={isRunning}
                className="min-w-[80px] text-center bg-dark-700/80 border border-dark-600 rounded-xl py-2 px-3 text-white text-sm font-bold hover:border-primary-500/50 transition-all disabled:cursor-not-allowed"
              >
                {targetMinutes}m
              </button>
            )}

            <button
              onClick={() => handleAdjust(STEP)}
              disabled={isRunning || targetMinutes >= MAX_MINUTES}
              className="w-10 h-10 rounded-full bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white flex items-center justify-center text-lg font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Circular Progress */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
          />
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="url(#timer-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={mode === 'countdown' ? '#f59e0b' : '#22c55e'} />
              <stop offset="100%" stopColor={mode === 'countdown' ? '#eab308' : '#4ade80'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-mono font-bold text-white">
            {formatTime(displaySeconds)}
          </span>
          <span className="text-xs text-dark-400 mt-1">
            {isRunning
              ? mode === 'countdown' ? 'Focus time...' : 'Studying...'
              : seconds > 0 ? 'Paused' : 'Ready'}
          </span>
          {mode === 'countdown' && !isRunning && seconds === 0 && (
            <span className="text-[10px] text-dark-500 mt-0.5">{targetMinutes} min session</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggle}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all duration-200 ${
            isRunning
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
              : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
          }`}
        >
          {isRunning ? '⏸' : '▶️'}
        </button>

        {seconds > 0 && (
          <button
            onClick={handleStop}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-200"
          >
            ⏹
          </button>
        )}
      </div>

      {seconds > 0 && seconds < 60 && (
        <p className="text-xs text-dark-400">Minimum 1 minute to save session</p>
      )}

      {mode === 'countdown' && progress >= 100 && seconds > 0 && (
        <p className="text-sm text-primary-400 font-medium animate-pulse-slow">
          🎉 Time&apos;s up! Great focus session!
        </p>
      )}
    </div>
  );
}
