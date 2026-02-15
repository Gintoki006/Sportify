'use client';

export default function DashboardError({ error, reset }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6"
      role="alert"
    >
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted mb-6">
          An error occurred while loading this page. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && error?.message && (
          <pre className="text-xs text-red-500 bg-red-500/10 rounded-lg p-3 mb-4 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl bg-accent text-black font-semibold text-sm hover:brightness-110 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
