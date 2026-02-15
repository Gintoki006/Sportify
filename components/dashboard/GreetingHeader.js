'use client';

const SPORT_META = {
  FOOTBALL: { emoji: '⚽', label: 'Football' },
  CRICKET: { emoji: '🏏', label: 'Cricket' },
  BASKETBALL: { emoji: '🏀', label: 'Basketball' },
  BADMINTON: { emoji: '🏸', label: 'Badminton' },
  TENNIS: { emoji: '🎾', label: 'Tennis' },
  VOLLEYBALL: { emoji: '🏐', label: 'Volleyball' },
};

export default function GreetingHeader({ userName, stats }) {
  const { totalEntries, thisWeekEntries, activeSports, activeGoals } = stats;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          Welcome back, {userName?.split(' ')[0] || 'Athlete'} 👋
        </h1>
        <p className="text-muted text-sm mt-1">
          {thisWeekEntries > 0
            ? `You've logged ${thisWeekEntries} entr${thisWeekEntries === 1 ? 'y' : 'ies'} this week. Keep it up!`
            : "No entries this week yet. Let's get started!"}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label="Active Sports"
          value={activeSports}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          accent
        />
        <SummaryCard
          label="Total Entries"
          value={totalEntries}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <SummaryCard
          label="This Week"
          value={thisWeekEntries}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <SummaryCard
          label="Active Goals"
          value={activeGoals}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, accent }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <div className={`${accent ? 'text-accent' : 'text-muted'}`}>
          {icon}
        </div>
        <span className="text-xs font-medium text-muted uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}
