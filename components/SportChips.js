'use client';
import { useState } from 'react';

const sports = [
  { name: 'Basketball', emoji: '🏀' },
  { name: 'Volleyball', emoji: '🏐' },
  { name: 'Football', emoji: '⚽' },
  { name: 'Tennis', emoji: '🎾' },
  { name: 'Cricket', emoji: '🏏' },
  { name: 'Badminton', emoji: '🏸' },
];

export default function SportChips() {
  const [active, setActive] = useState('Football');

  return (
    <section className="bg-bg py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
          {sports.map((sport) => (
            <button
              key={sport.name}
              onClick={() => setActive(sport.name)}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                active === sport.name
                  ? 'bg-primary text-bg border-primary shadow-md'
                  : 'bg-surface text-muted border-border hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              <span>{sport.emoji}</span>
              {sport.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
