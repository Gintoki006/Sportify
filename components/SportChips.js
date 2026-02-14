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
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap gap-3">
          {sports.map((sport) => (
            <button
              key={sport.name}
              onClick={() => setActive(sport.name)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                active === sport.name
                  ? 'bg-primary text-bg border-primary'
                  : 'bg-surface text-muted border-border hover:border-primary/40'
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
