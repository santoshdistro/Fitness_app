import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import {
  addDays,
  addMonths,
  isToday,
  monthLabel,
  monthMatrix,
  parseDate,
  todayDateString,
  weekDays,
} from '../utils/date';

type Props = {
  selectedDate: string;
  onChange: (dateStr: string) => void;
};

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function titleLabel(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  if (dateStr === addDays(todayDateString(), -1)) return 'Yesterday';
  if (dateStr === addDays(todayDateString(), 1)) return 'Tomorrow';
  return parseDate(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function DateNavigator({ selectedDate, onChange }: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);

  const days = weekDays(selectedDate);
  const today = todayDateString();

  function openCalendar() {
    setCalendarMonth(selectedDate);
    setCalendarOpen(open => !open);
  }

  function pick(dateStr: string) {
    onChange(dateStr);
    setCalendarOpen(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={openCalendar}
        className="flex items-center gap-1.5"
        aria-expanded={calendarOpen}
      >
        <span className="text-lg font-black tracking-tight text-[var(--text)]">
          {titleLabel(selectedDate)}
        </span>
        {calendarOpen ? (
          <ChevronUp size={18} className="text-[var(--muted)]" />
        ) : (
          <ChevronDown size={18} className="text-[var(--muted)]" />
        )}
      </button>

      {calendarOpen ? (
        <div className="glass-card anim-drop-in mt-3 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-[var(--text)]">{monthLabel(calendarMonth)}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCalendarMonth(m => addMonths(m, -1))}
                aria-label="Previous month"
                className="glass flex h-7 w-7 items-center justify-center rounded-full"
              >
                <ChevronLeft size={14} className="text-[var(--muted)]" />
              </button>
              <button
                type="button"
                onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                aria-label="Next month"
                className="glass flex h-7 w-7 items-center justify-center rounded-full"
              >
                <ChevronRight size={14} className="text-[var(--muted)]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LETTERS.map((letter, i) => (
              <span key={i} className="text-[10px] font-bold uppercase text-[var(--muted)]">
                {letter}
              </span>
            ))}
            {monthMatrix(calendarMonth).map((cell, i) => {
              if (!cell) return <span key={i} />;
              const day = parseDate(cell).getDate();
              const selected = cell === selectedDate;
              const future = cell > today;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={future}
                  onClick={() => pick(cell)}
                  className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm disabled:opacity-30"
                  style={
                    selected
                      ? { background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700 }
                      : cell === today
                        ? { color: 'var(--accent)', fontWeight: 700 }
                        : { color: 'var(--text)' }
                  }
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-between">
          {days.map((dateStr, i) => {
            const selected = dateStr === selectedDate;
            const future = dateStr > today;
            const dayNum = parseDate(dateStr).getDate();
            return (
              <button
                key={dateStr}
                type="button"
                disabled={future}
                onClick={() => onChange(dateStr)}
                className="flex flex-col items-center gap-1.5 disabled:opacity-30"
              >
                <span className="text-[10px] font-bold uppercase text-[var(--muted)]">
                  {WEEKDAY_LETTERS[i]}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm"
                  style={
                    selected
                      ? { background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700 }
                      : dateStr === today
                        ? { border: '1.5px dashed var(--accent)', color: 'var(--text)' }
                        : { color: 'var(--text)' }
                  }
                >
                  {dayNum}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
