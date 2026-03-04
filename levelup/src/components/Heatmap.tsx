'use client';

import React, { useMemo } from 'react';
import { format, subDays, startOfDay, getDay } from 'date-fns';

interface HeatmapProps {
  data: Record<string, number>; // date string -> minutes
  days?: number;
}

export default function Heatmap({ data, days = 365 }: HeatmapProps) {
  const cells = useMemo(() => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, 'yyyy-MM-dd');
      const minutes = data[key] || 0;
      result.push({ date: key, minutes, dayOfWeek: getDay(date) });
    }
    return result;
  }, [data, days]);

  const getColor = (minutes: number) => {
    if (minutes === 0) return 'bg-dark-800';
    if (minutes < 30) return 'bg-primary-900';
    if (minutes < 60) return 'bg-primary-700';
    if (minutes < 120) return 'bg-primary-500';
    return 'bg-primary-400';
  };

  // Group cells into weeks  
  const weeks: typeof cells[] = [];
  let currentWeek: typeof cells = [];

  // Pad the first week with empty cells
  if (cells.length > 0) {
    const firstDayOfWeek = cells[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: '', minutes: -1, dayOfWeek: i });
    }
  }

  cells.forEach((cell) => {
    currentWeek.push(cell);
    if (cell.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const validCell = week.find(c => c.minutes >= 0);
      if (validCell) {
        const month = new Date(validCell.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ label: format(new Date(validCell.date), 'MMM'), index: i });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="min-w-[700px]">
        {/* Month labels */}
        <div className="flex gap-[3px] mb-1 ml-8">
          {weeks.map((_, i) => {
            const label = monthLabels.find(l => l.index === i);
            return (
              <div key={i} className="w-[11px] text-[9px] text-dark-400">
                {label?.label || ''}
              </div>
            );
          })}
        </div>

        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
              <div key={i} className="h-[11px] text-[9px] text-dark-400 leading-[11px]">
                {day}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, ci) => (
                  <div
                    key={`${wi}-${ci}`}
                    className={`w-[11px] h-[11px] rounded-[2px] ${
                      cell.minutes < 0 ? 'bg-transparent' : getColor(cell.minutes)
                    } transition-colors duration-200 hover:ring-1 hover:ring-white/30`}
                    title={cell.minutes >= 0 ? `${cell.date}: ${cell.minutes}min` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 ml-8">
          <span className="text-[10px] text-dark-400">Less</span>
          {['bg-dark-800', 'bg-primary-900', 'bg-primary-700', 'bg-primary-500', 'bg-primary-400'].map((color, i) => (
            <div key={i} className={`w-[11px] h-[11px] rounded-[2px] ${color}`} />
          ))}
          <span className="text-[10px] text-dark-400">More</span>
        </div>
      </div>
    </div>
  );
}
