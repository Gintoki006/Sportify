import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-bg border-t border-border py-12 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
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
                <Link href="#" className="hover:text-primary transition-colors">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Vision
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
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

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4">
              Follow Us On
            </h4>
            <div className="flex gap-4 text-muted">
              {['Facebook', 'Twitter', 'YouTube', 'LinkedIn'].map(
                (platform) => (
                  <Link
                    key={platform}
                    href="#"
                    className="hover:text-primary transition-colors text-sm"
                    aria-label={platform}
                  >
                    {platform === 'Facebook' && 'f'}
                    {platform === 'Twitter' && '𝕏'}
                    {platform === 'YouTube' && '▶'}
                    {platform === 'LinkedIn' && 'in'}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-center text-xs text-muted">
          © 2026 Sportify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
