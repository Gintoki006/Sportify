import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-bg border-t border-border py-10 sm:py-12 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xl font-bold text-primary">Sportify</span>
            </Link>
            <p className="text-sm text-muted leading-relaxed max-w-xs">
              Track stats, set goals, and manage tournaments across multiple
              sports in one place.
            </p>
          </div>

          {/* About Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
              About
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link
                  href="#about"
                  className="hover:text-primary transition-colors"
                >
                  Our Mission
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  className="hover:text-primary transition-colors"
                >
                  Vision
                </Link>
              </li>
              <li>
                <Link
                  href="#events"
                  className="hover:text-primary transition-colors"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link
                  href="/sign-up"
                  className="hover:text-primary transition-colors"
                >
                  Get Started
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-in"
                  className="hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="#events"
                  className="hover:text-primary transition-colors"
                >
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="#membership"
                  className="hover:text-primary transition-colors"
                >
                  Membership
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
              Follow Us
            </h4>
            <div className="flex flex-wrap gap-3 text-muted">
              {[
                { name: 'Facebook', icon: 'f' },
                { name: 'Twitter', icon: '𝕏' },
                { name: 'YouTube', icon: '▶' },
                { name: 'LinkedIn', icon: 'in' },
              ].map((platform) => (
                <Link
                  key={platform.name}
                  href="#"
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-surface hover:text-primary transition-colors text-sm"
                  aria-label={platform.name}
                >
                  {platform.icon}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <p>© 2026 Sportify. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
