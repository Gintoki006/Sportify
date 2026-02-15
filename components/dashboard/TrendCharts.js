'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const SPORT_COLORS = {
  FOOTBALL: '#22c55e',
  CRICKET: '#f59e0b',
  BASKETBALL: '#ef4444',
  BADMINTON: '#06b6d4',
  TENNIS: '#84cc16',
  VOLLEYBALL: '#eab308',
};

const SPORT_LABELS = {
  FOOTBALL: '⚽ Football',
  CRICKET: '🏏 Cricket',
  BASKETBALL: '🏀 Basketball',
  BADMINTON: '🏸 Badminton',
  TENNIS: '🎾 Tennis',
  VOLLEYBALL: '🏐 Volleyball',
};

/**
 * Builds chart data from raw stat entries.
 * Groups by date, sums the first metric per sport for the y-axis.
 */
function buildChartData(entries, sportType) {
  const filtered = entries.filter((e) => e.sportType === sportType);
  if (filtered.length === 0) return [];

  // Get the primary metric key for this sport
  const firstEntry = filtered[0];
  const metricKeys = Object.keys(firstEntry.metrics || {});
  const primaryKey = metricKeys[0]; // e.g. "goals" for football

  // Group by date
  const byDate = {};
  for (const entry of filtered) {
    const dateKey = new Date(entry.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!byDate[dateKey]) {
      byDate[dateKey] = { date: dateKey };
      for (const k of metricKeys) {
        byDate[dateKey][k] = 0;
      }
    }
    for (const k of metricKeys) {
      byDate[dateKey][k] += Number(entry.metrics?.[k] || 0);
    }
  }

  return Object.values(byDate).reverse(); // chronological order
}

export default function TrendCharts({ entries, sportTypes }) {
  const [selectedSport, setSelectedSport] = useState(sportTypes[0] || '');
  const [chartType, setChartType] = useState('line');

  const chartData = useMemo(
    () => buildChartData(entries, selectedSport),
    [entries, selectedSport]
  );

  const metricKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    return Object.keys(chartData[0]).filter((k) => k !== 'date');
  }, [chartData]);

  const color = SPORT_COLORS[selectedSport] || '#CDEB5E';

  if (!sportTypes || sportTypes.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">
          Trend Charts
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📈</div>
          <p className="text-muted text-sm">No data to chart yet.</p>
          <p className="text-muted text-xs mt-1">
            Log some stats to see your trends!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
          Trend Charts
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sport toggle chips */}
          {sportTypes.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedSport(st)}
              className={`
                text-xs px-3 py-1.5 rounded-full font-medium transition-all
                ${selectedSport === st
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-bg text-muted border border-border hover:border-accent/30'
                }
              `}
            >
              {SPORT_LABELS[st] || st}
            </button>
          ))}

          {/* Chart type switch */}
          <div className="flex items-center bg-bg rounded-full border border-border p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${chartType === 'line' ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}
            >
              Line
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${chartType === 'bar' ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted text-sm">
            No entries for {SPORT_LABELS[selectedSport] || selectedSport} yet.
          </p>
        </div>
      ) : (
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--c-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--c-border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--c-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--c-primary)',
                  }}
                />
                {metricKeys.map((mk, i) => (
                  <Line
                    key={mk}
                    type="monotone"
                    dataKey={mk}
                    stroke={color}
                    strokeWidth={2}
                    strokeOpacity={1 - i * 0.2}
                    dot={{ r: 3, fill: color }}
                    activeDot={{ r: 5 }}
                    name={mk.replace(/_/g, ' ')}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--c-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--c-border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--c-muted)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--c-surface)',
                    border: '1px solid var(--c-border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--c-primary)',
                  }}
                />
                {metricKeys.map((mk, i) => (
                  <Bar
                    key={mk}
                    dataKey={mk}
                    fill={color}
                    fillOpacity={1 - i * 0.2}
                    radius={[6, 6, 0, 0]}
                    name={mk.replace(/_/g, ' ')}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
