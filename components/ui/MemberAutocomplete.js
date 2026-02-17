'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

/**
 * MemberAutocomplete — text input with club-member suggestions.
 *
 * Props:
 *  - members        {Array<{ id, name, avatarUrl? }>}  available club members
 *  - value          {string}   current text value (player name)
 *  - playerId       {string}   currently linked user id ('' if none)
 *  - onChange        (name, playerId) => void
 *  - placeholder     string
 *  - required        boolean
 *  - className       string     extra classes for the wrapper
 *  - inputClassName  string     extra classes for the <input>
 *  - disabled        boolean
 */
export default function MemberAutocomplete({
  members = [],
  value = '',
  playerId = '',
  onChange,
  placeholder = 'Player name',
  required = false,
  className = '',
  inputClassName = '',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = members.filter(
    (m) =>
      m.name &&
      m.name.toLowerCase().includes(query.toLowerCase()) &&
      query.trim().length > 0,
  );

  const handleInput = useCallback(
    (e) => {
      const v = e.target.value;
      setQuery(v);
      setOpen(true);
      setActiveIndex(-1);
      // When typing freely, clear any previously linked playerId
      onChange(v, '');
    },
    [onChange],
  );

  const handleSelect = useCallback(
    (member) => {
      setQuery(member.name);
      setOpen(false);
      setActiveIndex(-1);
      onChange(member.name, member.id);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    // Small delay so click on option registers first
    setTimeout(() => {
      setOpen(false);
      setActiveIndex(-1);
    }, 150);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (!open || filtered.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(filtered[activeIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
        setActiveIndex(-1);
      }
    },
    [open, filtered, activeIndex, handleSelect],
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => query.trim() && setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          role="combobox"
          aria-expanded={open && filtered.length > 0}
          aria-autocomplete="list"
          aria-controls="member-autocomplete-list"
          aria-activedescendant={
            activeIndex >= 0 ? `member-option-${activeIndex}` : undefined
          }
          aria-label={placeholder}
          className={
            inputClassName ||
            'w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all'
          }
        />
        {/* Linked indicator */}
        {playerId && (
          <span
            className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-500"
            title="Linked to club member"
          />
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul
          id="member-autocomplete-list"
          role="listbox"
          aria-label="Matching club members"
          className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
        >
          {filtered.map((m, idx) => (
            <li
              key={m.id}
              id={`member-option-${idx}`}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  handleSelect(m);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm text-primary hover:bg-accent/10 flex items-center gap-2 transition-colors ${
                  idx === activeIndex ? 'bg-accent/10' : ''
                }`}
              >
                {m.avatarUrl ? (
                  <Image
                    src={m.avatarUrl}
                    alt=""
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="truncate">{m.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
