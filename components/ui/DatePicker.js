'use client';

import { useState, useRef, useEffect } from 'react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(str) {
  if (!str) return '';
  const d = parseDate(str);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({
  value,
  onChange,
  min,
  max,
  id,
  className = '',
  required,
  placeholder = 'dd-mm-yyyy',
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initial = selected || today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const containerRef = useRef(null);
  const calendarRef = useRef(null);

  function toggleOpen() {
    setOpen((prev) => {
      if (!prev) {
        // Sync viewMonth/viewYear to current value when opening
        const d = parseDate(value) || today;
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        // Compute drop direction
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDropUp(window.innerHeight - rect.bottom < 340);
        }
      }
      return !prev;
    });
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const [dropUp, setDropUp] = useState(false);

  const minDate = parseDate(min);
  const maxDate = parseDate(max);

  function isDisabled(date) {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  const isSameDay = (a, b) =>
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isToday = (date) => isSameDay(date, today);

  function handleSelect(day) {
    const d = new Date(viewYear, viewMonth, day);
    if (isDisabled(d)) return;
    onChange({ target: { value: formatDate(d) } });
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    if (!isDisabled(t)) {
      onChange({ target: { value: formatDate(t) } });
    }
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
  }

  function handleClear() {
    onChange({ target: { value: '' } });
    setOpen(false);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build calendar grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={containerRef} className="relative">
      {/* Hidden native input for form validation */}
      {required && (
        <input type="hidden" value={value || ''} required={required} />
      )}

      {/* Trigger button styled as input */}
      <button
        type="button"
        id={id}
        onClick={toggleOpen}
        className={`
          flex items-center justify-between w-full text-left
          px-4 py-2.5 rounded-xl bg-bg border border-border text-sm
          focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all
          ${value ? 'text-primary' : 'text-muted'}
          ${className}
        `}
      >
        <span>{value ? formatDisplay(value) : placeholder}</span>
        {/* Calendar SVG icon */}
        <svg
          className="w-5 h-5 text-accent shrink-0 ml-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          ref={calendarRef}
          className={`
            absolute z-50 w-72 p-3 rounded-xl
            bg-surface border border-border shadow-2xl
            ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}
            left-0
          `}
        >
          {/* Header — month/year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-bg text-muted hover:text-primary transition-colors"
              aria-label="Previous month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-sm font-semibold text-primary">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-bg text-muted hover:text-primary transition-colors"
              aria-label="Next month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-muted uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="w-full aspect-square" />;
              }
              const date = new Date(viewYear, viewMonth, day);
              const disabled = isDisabled(date);
              const sel = isSameDay(date, selected);
              const tod = isToday(date);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(day)}
                  className={`
                    w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                    ${
                      disabled
                        ? 'text-muted/30 cursor-not-allowed'
                        : sel
                          ? 'bg-accent text-black font-bold shadow-md'
                          : tod
                            ? 'bg-accent/15 text-accent font-bold hover:bg-accent/25'
                            : 'text-primary hover:bg-bg'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer — Clear & Today */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-muted hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-bg"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={goToday}
              className="text-xs font-medium text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-md hover:bg-accent/10"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
