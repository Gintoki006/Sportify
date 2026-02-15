'use client';

import { useState } from 'react';
import GoalCreationModal from '@/components/goals/GoalCreationModal';

const SPORT_LABELS = {
  FOOTBALL: 'Football',
  CRICKET: 'Cricket',
  BASKETBALL: 'Basketball',
  BADMINTON: 'Badminton',
  TENNIS: 'Tennis',
  VOLLEYBALL: 'Volleyball',
};

const SPORT_COLORS = {
  FOOTBALL: '#22c55e',
  CRICKET: '#f59e0b',
  BASKETBALL: '#ef4444',
  BADMINTON: '#06b6d4',
  TENNIS: '#84cc16',
  VOLLEYBALL: '#eab308',
};

const SPORT_EMOJIS = {
  FOOTBALL: '⚽',
  CRICKET: '🏏',
  BASKETBALL: '🏀',
  BADMINTON: '🏸',
  TENNIS: '🎾',
  VOLLEYBALL: '🏐',
};

function ProgressBar({ current, target, color }) {
  const percent =
    target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>
          {current} / {target}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percent}% progress`}
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function GoalCard({ goal, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const color = SPORT_COLORS[goal.sportType] || '#CDEB5E';
  const sportLabel = SPORT_LABELS[goal.sportType] || goal.sportType;
  const emoji = SPORT_EMOJIS[goal.sportType] || '🏅';
  const percent =
    goal.target > 0
      ? Math.min(Math.round((goal.current / goal.target) * 100), 100)
      : 0;

  const isOverdue =
    goal.deadline && !goal.completed && new Date(goal.deadline) < new Date();

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: goal.id }),
      });
      if (res.ok) onDelete();
      else setDeleting(false);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-xl">
            {emoji}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-primary capitalize">
              {goal.metric.replace(/_/g, ' ')}
            </h4>
            <p className="text-xs text-muted">{sportLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {goal.completed && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
              ✓ Completed
            </span>
          )}
          {isOverdue && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
              Overdue
            </span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-muted hover:text-red-500 transition-all text-xs p-1"
            aria-label="Delete goal"
            title="Delete goal"
          >
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>

      <ProgressBar current={goal.current} target={goal.target} color={color} />

      <div className="flex items-center justify-between mt-3 text-xs text-muted">
        <span>
          {goal.deadline
            ? `Due ${new Date(goal.deadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}`
            : 'No deadline'}
        </span>
        <span className="font-bold text-sm" style={{ color }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

export default function GoalsPageClient({
  activeGoals: propActiveGoals,
  completedGoals: propCompletedGoals,
  sportProfiles,
}) {
  const [tab, setTab] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  // Track locally-deleted IDs so removals are instant without duplicating props into state
  const [deletedIds, setDeletedIds] = useState(new Set());

  const activeGoals = propActiveGoals.filter((g) => !deletedIds.has(g.id));
  const completedGoals = propCompletedGoals.filter(
    (g) => !deletedIds.has(g.id),
  );

  function handleGoalDeleted(goalId) {
    setDeletedIds((prev) => new Set(prev).add(goalId));
  }

  const displayGoals = tab === 'active' ? activeGoals : completedGoals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Goals & Progress</h1>
          <p className="text-muted text-sm mt-1">
            Track your targets and see how far you&apos;ve come.
          </p>
        </div>
        {sportProfiles.length > 0 && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
          >
            <span className="text-lg">+</span> New Goal
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Active" value={activeGoals.length} icon="🎯" />
        <SummaryCard
          label="Completed"
          value={completedGoals.length}
          icon="✅"
        />
        <SummaryCard
          label="Avg Progress"
          value={
            activeGoals.length > 0
              ? `${Math.round(
                  activeGoals.reduce(
                    (sum, g) =>
                      sum +
                      (g.target > 0
                        ? Math.min((g.current / g.target) * 100, 100)
                        : 0),
                    0,
                  ) / activeGoals.length,
                )}%`
              : '—'
          }
          icon="📊"
        />
        <SummaryCard
          label="Overdue"
          value={
            activeGoals.filter(
              (g) => g.deadline && new Date(g.deadline) < new Date(),
            ).length
          }
          icon="⏰"
        />
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 p-1 bg-bg rounded-xl w-fit"
        role="tablist"
        aria-label="Goal status"
      >
        <TabButton
          active={tab === 'active'}
          onClick={() => setTab('active')}
          count={activeGoals.length}
        >
          Active
        </TabButton>
        <TabButton
          active={tab === 'completed'}
          onClick={() => setTab('completed')}
          count={completedGoals.length}
        >
          Completed
        </TabButton>
      </div>

      {/* Goal list */}
      {displayGoals.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">{tab === 'active' ? '🎯' : '🏆'}</div>
          <h3 className="text-primary font-semibold text-lg mb-1">
            {tab === 'active' ? 'No active goals' : 'No completed goals yet'}
          </h3>
          <p className="text-muted text-sm max-w-sm mx-auto">
            {tab === 'active'
              ? 'Set a goal to start tracking your progress across your sports.'
              : "Keep working toward your active goals — they'll show here once completed!"}
          </p>
          {tab === 'active' && sportProfiles.length > 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
            >
              <span className="text-lg">+</span> Create Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={() => handleGoalDeleted(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <GoalCreationModal
          sportProfiles={sportProfiles}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}

function TabButton({ active, onClick, count, children }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-surface text-primary shadow-sm'
          : 'text-muted hover:text-primary'
      }`}
    >
      {children}
      <span
        className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-accent/20 text-accent' : 'bg-border text-muted'
        }`}
      >
        {count}
      </span>
    </button>
  );
}
