'use client';

import { useState } from 'react';

/**
 * PlayerDropdown — tappable roster-chip grid with "Custom" fallback.
 *
 * Designed for match scoring flows — fast, touch-friendly player selection
 * from the known team lineup, with an escape hatch for unlisted players.
 *
 * Props:
 *  - players       {Array<{ id, name }>}  roster / available players
 *  - value         {string}               current player name
 *  - playerId      {string}               currently linked player id ('' if none)
 *  - onChange       (name: string, playerId: string) => void
 *  - placeholder    string                input placeholder (custom mode)
 *  - label          string                optional top label
 *  - className      string                wrapper classes
 */
export default function PlayerDropdown({
  players = [],
  value = '',
  playerId = '',
  onChange,
  placeholder = 'Player name',
  label = '',
  className = '',
}) {
  // customMode is purely user-toggled; auto-custom when no roster available
  const [customMode, setCustomMode] = useState(() => players.length === 0);
  const [customName, setCustomName] = useState('');

  // Derive whether to show the custom input (user toggle OR empty roster)
  const showCustom = customMode || players.length === 0;

  function selectPlayer(p) {
    setCustomMode(false);
    setCustomName('');
    onChange(p.name, p.id);
  }

  function handleCustomInput(name) {
    setCustomName(name);
    onChange(name, '');
  }

  function toggleCustom() {
    if (customMode) {
      // Leaving custom mode — clear
      setCustomMode(false);
      setCustomName('');
      onChange('', '');
    } else {
      // Entering custom mode — clear roster selection
      setCustomMode(true);
      onChange('', '');
    }
  }

  const isSelected = (p) => (playerId ? p.id === playerId : p.name === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-[10px] text-muted uppercase mb-1">
          {label}
        </label>
      )}

      {/* Player chips */}
      {players.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1 mb-1.5">
          {players.map((p) => (
            <button
              key={p.id || p.name}
              type="button"
              onClick={() => selectPlayer(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all truncate max-w-40 ${
                isSelected(p)
                  ? 'bg-accent/20 text-accent border border-accent/40 ring-1 ring-accent/30'
                  : 'bg-bg border border-border text-primary hover:border-accent/40 hover:bg-accent/5'
              }`}
            >
              {p.name}
            </button>
          ))}

          {/* Custom toggle chip */}
          <button
            type="button"
            onClick={toggleCustom}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              showCustom
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-bg border border-dashed border-border text-muted hover:border-accent/40'
            }`}
          >
            {showCustom ? '✕ Cancel' : '+ Custom'}
          </button>
        </div>
      )}

      {/* Custom name input */}
      {showCustom && (
        <input
          type="text"
          value={customName}
          onChange={(e) => handleCustomInput(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 rounded-lg border border-border bg-bg text-primary text-sm placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
        />
      )}

      {/* Empty state — no players, no custom yet */}
      {players.length === 0 && !showCustom && (
        <p className="text-[10px] text-muted italic">No players available</p>
      )}
    </div>
  );
}
