'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

function ThemeToggle({ className = '' }) {
  const { dark, toggleDark } = useTheme();
  return (
    <button
      onClick={toggleDark}
      className={`flex items-center justify-center p-1.5 rounded-full border border-border hover:bg-surface transition-colors ${className}`}
      aria-label="Toggle dark mode"
    >
      {dark ? (
        <svg
          className="w-4 h-4 text-accent"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-bold tracking-tight text-primary">
            Sportify
          </span>
        </Link>

        {/* Desktop: Theme + Auth */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          <SignedOut>
            <Link
              href="/sign-in"
              className="px-3.5 py-1.5 rounded-full text-sm font-medium text-muted hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: { avatarBox: 'w-8 h-8' },
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile: Theme + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            className="p-1.5 text-primary"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-bg border-t border-border px-6 py-3 space-y-2 animate-in slide-in-from-top">
          <SignedOut>
            <Link
              href="/sign-in"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-muted hover:text-primary"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMenuOpen(false)}
              className="block text-center px-5 py-2 rounded-full bg-accent text-black text-sm font-semibold"
            >
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="block text-center px-5 py-2 rounded-full bg-accent text-black text-sm font-semibold"
            >
              Go to Dashboard
            </Link>
            <div className="pt-1">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: { avatarBox: 'w-8 h-8' },
                }}
              />
            </div>
          </SignedIn>
        </div>
      )}
    </nav>
  );
}
