import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border py-8 sm:py-10 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          {/* Brand */}
          <div className="text-center sm:text-left space-y-1.5">
            <Link href="/" className="inline-flex items-center gap-1.5">
              <span className="text-lg">⚡</span>
              <span className="text-base font-bold text-primary">Sportify</span>
            </Link>
            <p className="text-xs text-muted">Built for athletes</p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted">
            <Link
              href="/sign-up"
              className="hover:text-primary transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/sign-in"
              className="hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-primary transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted">
          <p>© 2026 Sportify. Made with ❤️ for athletes everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
