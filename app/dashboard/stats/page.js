import { ensureDbUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { SPORT_METRICS } from '@/lib/sportMetrics';

const SPORT_LABELS = {
  FOOTBALL: 'Football',
  CRICKET: 'Cricket',
  BASKETBALL: 'Basketball',
  BADMINTON: 'Badminton',
  TENNIS: 'Tennis',
  VOLLEYBALL: 'Volleyball',
};

const SPORT_EMOJIS = {
  FOOTBALL: '⚽',
  CRICKET: '🏏',
  BASKETBALL: '🏀',
  BADMINTON: '🏸',
  TENNIS: '🎾',
  VOLLEYBALL: '🏐',
};

export default async function StatsPage() {
  const user = await ensureDbUser();
  if (!user) redirect('/sign-in');

  const sportProfiles = user.sportProfiles || [];
  const sportProfileIds = sportProfiles.map((sp) => sp.id);

  if (sportProfileIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Stats</h1>
          <p className="text-muted text-sm mt-1">
            View all your recorded stat entries.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-primary font-semibold text-lg mb-1">
            No sports added yet
          </h3>
          <p className="text-muted text-sm">
            Complete onboarding or edit your profile to add sports.
          </p>
        </div>
      </div>
    );
  }

  // Build sport profile map
  const spMap = {};
  for (const sp of sportProfiles) {
    spMap[sp.id] = sp.sportType;
  }

  const entries = await prisma.statEntry.findMany({
    where: { sportProfileId: { in: sportProfileIds } },
    orderBy: { date: 'desc' },
    take: 100,
  });

  const enriched = entries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    opponent: e.opponent,
    notes: e.notes,
    metrics: e.metrics,
    source: e.source,
    sportType: spMap[e.sportProfileId],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Stats</h1>
        <p className="text-muted text-sm mt-1">
          All your recorded stat entries across sports.
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-primary font-semibold text-lg mb-1">
            No entries yet
          </h3>
          <p className="text-muted text-sm">
            Use the + button to log your first stat entry.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Stat entries">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Sport
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Metrics
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Opponent
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((entry, i) => {
                  const sportMetrics = SPORT_METRICS[entry.sportType] || [];
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-border/50 hover:bg-bg/50 transition-colors ${
                        i % 2 === 0 ? '' : 'bg-bg/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-primary whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true">
                            {SPORT_EMOJIS[entry.sportType]}
                          </span>
                          <span className="text-primary font-medium">
                            {SPORT_LABELS[entry.sportType]}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-primary">
                        {sportMetrics
                          .map((m) => {
                            const val = entry.metrics?.[m.key];
                            return val !== undefined
                              ? `${m.label}: ${val}`
                              : null;
                          })
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted truncate max-w-30">
                        {entry.opponent || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {entry.source === 'TOURNAMENT' ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                            Tournament
                          </span>
                        ) : (
                          <span className="text-xs text-muted">Manual</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
