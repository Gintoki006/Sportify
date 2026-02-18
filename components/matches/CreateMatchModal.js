'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import AccessibleModal from '@/components/ui/AccessibleModal';
import DatePicker from '@/components/ui/DatePicker';

/* ───────── Sport metadata ───────── */
const SPORTS = [
  { key: 'FOOTBALL', emoji: '⚽', label: 'Football' },
  { key: 'CRICKET', emoji: '🏏', label: 'Cricket' },
  { key: 'BASKETBALL', emoji: '🏀', label: 'Basketball' },
  { key: 'BADMINTON', emoji: '🏸', label: 'Badminton' },
  { key: 'TENNIS', emoji: '🎾', label: 'Tennis' },
  { key: 'VOLLEYBALL', emoji: '🏐', label: 'Volleyball' },
];

const INDIVIDUAL_SPORTS = ['TENNIS', 'BADMINTON'];
const OVERS_OPTIONS = [5, 10, 15, 20];
const PLAYERS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/* ═══════════════════════════════════════════════════════
   Create Match Modal
   ═══════════════════════════════════════════════════════ */
export default function CreateMatchModal({ onClose, onCreated }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState(null);

  // Step 1: Sport
  const [sportType, setSportType] = useState('');

  // Step 2: Teams / Players
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');

  // Player search for individual sports
  const [playerAResults, setPlayerAResults] = useState([]);
  const [playerBResults, setPlayerBResults] = useState([]);
  const [selectedPlayerA, setSelectedPlayerA] = useState(null);
  const [selectedPlayerB, setSelectedPlayerB] = useState(null);
  const [searchingA, setSearchingA] = useState(false);
  const [searchingB, setSearchingB] = useState(false);
  const searchTimerA = useRef(null);
  const searchTimerB = useRef(null);

  // Step 3: Cricket config
  const [overs, setOvers] = useState(20);
  const [playersPerSide, setPlayersPerSide] = useState(11);

  // Step 3: Football config
  const [halfDuration, setHalfDuration] = useState(45);
  const [squadSize, setSquadSize] = useState(11);

  // Step 4: Date
  const [matchDate, setMatchDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  const isIndividual = INDIVIDUAL_SPORTS.includes(sportType);
  const isCricket = sportType === 'CRICKET';
  const isFootball = sportType === 'FOOTBALL';
  const totalSteps = isCricket || isFootball ? 4 : 3;

  // Debounced search for individual sport player search
  function handleSearchA(query) {
    if (searchTimerA.current) clearTimeout(searchTimerA.current);
    if (query.trim().length < 2) {
      setPlayerAResults([]);
      setSearchingA(false);
      return;
    }
    setSearchingA(true);
    searchTimerA.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPlayerAResults(data.users || []);
        }
      } catch {
        /* ignore */
      }
      setSearchingA(false);
    }, 300);
  }

  function handleSearchB(query) {
    if (searchTimerB.current) clearTimeout(searchTimerB.current);
    if (query.trim().length < 2) {
      setPlayerBResults([]);
      setSearchingB(false);
      return;
    }
    setSearchingB(true);
    searchTimerB.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.ok) {
          const data = await res.json();
          setPlayerBResults(data.users || []);
        }
      } catch {
        /* ignore */
      }
      setSearchingB(false);
    }, 300);
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (searchTimerA.current) clearTimeout(searchTimerA.current);
      if (searchTimerB.current) clearTimeout(searchTimerB.current);
    };
  }, []);

  // Navigation
  function nextStep() {
    if (step === 1 && !sportType) {
      setError('Please select a sport.');
      return;
    }
    if (step === 2) {
      if (isIndividual) {
        if (!teamA.trim() && !selectedPlayerA) {
          setError('Please enter or select Player A.');
          return;
        }
        if (!teamB.trim() && !selectedPlayerB) {
          setError('Please enter or select Player B.');
          return;
        }
      } else {
        if (!teamA.trim() || !teamB.trim()) {
          setError('Please enter both team names.');
          return;
        }
      }
    }
    setError('');
    setStep((s) => s + 1);
  }

  function prevStep() {
    setError('');
    setStep((s) => s - 1);
  }

  // Submit
  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    const payload = {
      sportType,
      teamA: isIndividual
        ? selectedPlayerA?.name || teamA.trim()
        : teamA.trim(),
      teamB: isIndividual
        ? selectedPlayerB?.name || teamB.trim()
        : teamB.trim(),
      date: matchDate || undefined,
    };

    if (isIndividual) {
      if (selectedPlayerA) payload.playerAId = selectedPlayerA.id;
      if (selectedPlayerB) payload.playerBId = selectedPlayerB.id;
    }

    if (isCricket) {
      payload.overs = overs;
      payload.playersPerSide = playersPerSide;
    }

    if (isFootball) {
      payload.halfDuration = halfDuration;
      payload.squadSize = squadSize;
    }

    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create match.');
        setSubmitting(false);
        return;
      }

      setCreatedMatchId(data.match?.id);
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  // Which step is the final one?
  const isLastStep = isCricket ? step === 4 : step === 3;

  return (
    <AccessibleModal
      isOpen={true}
      onClose={onClose}
      title={success ? 'Match Created!' : 'Create Match'}
      maxWidth="max-w-xl"
    >
      <div className="p-6 overflow-y-auto">
        {/* Success state */}
        {success ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Match created successfully!
            </h3>
            <p className="text-sm text-muted mb-6">
              Your {SPORTS.find((s) => s.key === sportType)?.label || sportType}{' '}
              match is ready.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (createdMatchId) {
                    router.push(`/dashboard/matches/${createdMatchId}`);
                  }
                  onCreated?.();
                }}
                className="px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
              >
                View Match
              </button>
              <button
                onClick={() => onCreated?.()}
                className="px-5 py-2.5 rounded-xl bg-surface border border-border text-primary font-medium text-sm hover:bg-bg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div
                    role="listitem"
                    aria-label={`Step ${s} of ${totalSteps}`}
                    aria-current={s === step ? 'step' : undefined}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s === step
                        ? 'bg-accent text-black'
                        : s < step
                          ? 'bg-accent/20 text-accent'
                          : 'bg-border text-muted'
                    }`}
                  >
                    {s < step ? '✓' : s}
                  </div>
                  {s < totalSteps && (
                    <div
                      className={`flex-1 h-0.5 rounded ${s < step ? 'bg-accent/40' : 'bg-border'}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Sport Selection */}
            {step === 1 && (
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  Select Sport
                </h3>
                <p className="text-sm text-muted mb-4">
                  Choose the sport for this match.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SPORTS.map((sport) => (
                    <button
                      key={sport.key}
                      onClick={() => {
                        setSportType(sport.key);
                        setError('');
                      }}
                      aria-pressed={sportType === sport.key}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        sportType === sport.key
                          ? 'border-accent bg-accent/10 shadow-md shadow-accent/10'
                          : 'border-border bg-surface hover:border-accent/30'
                      }`}
                    >
                      <span className="text-3xl">{sport.emoji}</span>
                      <span className="text-sm font-medium text-primary">
                        {sport.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Teams / Players */}
            {step === 2 && (
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  {isIndividual ? 'Players' : 'Teams'}
                </h3>
                <p className="text-sm text-muted mb-4">
                  {isIndividual
                    ? 'Enter player names or search for registered users.'
                    : 'Enter team names for this match.'}
                </p>

                <div className="space-y-4">
                  {/* Side A */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      {isIndividual ? 'Player A' : 'Team A'}
                    </label>
                    {isIndividual ? (
                      <PlayerSearchInput
                        value={teamA}
                        onChange={(v) => {
                          setTeamA(v);
                          handleSearchA(v);
                          setSelectedPlayerA(null);
                        }}
                        selectedPlayer={selectedPlayerA}
                        results={playerAResults}
                        searching={searchingA}
                        onSelect={(user) => {
                          setSelectedPlayerA(user);
                          setTeamA(user.name);
                          setPlayerAResults([]);
                          handleSearchA('');
                        }}
                        onClear={() => {
                          setSelectedPlayerA(null);
                          setTeamA('');
                        }}
                        placeholder="Search or enter player name"
                      />
                    ) : (
                      <input
                        type="text"
                        value={teamA}
                        onChange={(e) => setTeamA(e.target.value)}
                        placeholder="e.g. Team Alpha"
                        className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                      />
                    )}
                  </div>

                  {/* VS divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs font-bold text-muted">VS</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Side B */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1.5">
                      {isIndividual ? 'Player B' : 'Team B'}
                    </label>
                    {isIndividual ? (
                      <PlayerSearchInput
                        value={teamB}
                        onChange={(v) => {
                          setTeamB(v);
                          handleSearchB(v);
                          setSelectedPlayerB(null);
                        }}
                        selectedPlayer={selectedPlayerB}
                        results={playerBResults}
                        searching={searchingB}
                        onSelect={(user) => {
                          setSelectedPlayerB(user);
                          setTeamB(user.name);
                          setPlayerBResults([]);
                          handleSearchB('');
                        }}
                        onClear={() => {
                          setSelectedPlayerB(null);
                          setTeamB('');
                        }}
                        placeholder="Search or enter player name"
                      />
                    ) : (
                      <input
                        type="text"
                        value={teamB}
                        onChange={(e) => setTeamB(e.target.value)}
                        placeholder="e.g. Team Bravo"
                        className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 (Cricket): Cricket Config */}
            {step === 3 && isCricket && (
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  Cricket Configuration
                </h3>
                <p className="text-sm text-muted mb-4">
                  Set match format and team size.
                </p>

                <div className="space-y-5">
                  {/* Overs */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Overs per innings
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OVERS_OPTIONS.map((o) => (
                        <button
                          key={o}
                          onClick={() => setOvers(o)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            overs === o
                              ? 'bg-accent text-black'
                              : 'bg-surface border border-border text-muted hover:text-primary hover:border-accent/30'
                          }`}
                        >
                          T{o}
                        </button>
                      ))}
                      {/* Custom overs */}
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={!OVERS_OPTIONS.includes(overs) ? overs : ''}
                        onChange={(e) => setOvers(Number(e.target.value) || 20)}
                        placeholder="Custom"
                        aria-label="Custom overs"
                        className="w-20 px-3 py-2 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm text-center"
                      />
                    </div>
                  </div>

                  {/* Players per side */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Players per side
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PLAYERS_OPTIONS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlayersPerSide(p)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                            playersPerSide === p
                              ? 'bg-accent text-black'
                              : 'bg-surface border border-border text-muted hover:text-primary hover:border-accent/30'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 (Football): Football Config */}
            {step === 3 && isFootball && (
              <div>
                <h3 className="font-semibold text-primary mb-1">
                  Football Configuration
                </h3>
                <p className="text-sm text-muted mb-4">
                  Set half duration and squad size.
                </p>

                <div className="space-y-5">
                  {/* Half Duration */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Half Duration (minutes)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[30, 35, 40, 45].map((d) => (
                        <button
                          key={d}
                          onClick={() => setHalfDuration(d)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            halfDuration === d
                              ? 'bg-green-500 text-black'
                              : 'bg-surface border border-border text-muted hover:text-primary hover:border-green-500/30'
                          }`}
                        >
                          {d} min
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Squad Size */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Squad Size
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[5, 7, 11].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSquadSize(s)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                            squadSize === s
                              ? 'bg-green-500 text-black'
                              : 'bg-surface border border-border text-muted hover:text-primary hover:border-green-500/30'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Last step: Date */}
            {((step === 3 && !isCricket && !isFootball) ||
              (step === 4 && (isCricket || isFootball))) && (
              <div>
                <h3 className="font-semibold text-primary mb-1">Match Date</h3>
                <p className="text-sm text-muted mb-4">
                  When is this match happening?
                </p>
                <DatePicker
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm mt-3 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-primary transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              {isLastStep ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Creating…' : 'Create Match'}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  className="px-6 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
                >
                  Next →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </AccessibleModal>
  );
}

/* ───────── Player Search Input ───────── */
function PlayerSearchInput({
  value,
  onChange,
  selectedPlayer,
  results,
  searching,
  onSelect,
  onClear,
  placeholder,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (selectedPlayer) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30">
        {selectedPlayer.avatarUrl ? (
          <Image
            src={selectedPlayer.avatarUrl}
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
            {selectedPlayer.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <span className="text-sm font-medium text-primary flex-1">
          {selectedPlayer.name}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-muted hover:text-primary text-sm"
          aria-label="Clear selection"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 text-sm"
      />
      {searching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
        </div>
      )}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-xl z-10 max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onSelect(user);
                setShowDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-bg transition-colors text-left"
            >
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent">
                  {user.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-primary">{user.name}</p>
                {user.email && (
                  <p className="text-xs text-muted">{user.email}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
