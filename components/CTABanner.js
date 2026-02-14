import Link from 'next/link';

export default function CTABanner() {
  return (
    <section
      id="membership"
      className="bg-primary py-12 sm:py-16 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-5 sm:space-y-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-bg leading-snug">
          Latest updates, special Offers,
          <br className="hidden sm:block" />& Live Event Invitations!
        </h2>
        <p className="text-bg/70 max-w-md mx-auto text-sm sm:text-base">
          Join thousands of athletes already tracking their performance with
          Sportify. Start your journey today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full sm:flex-1 px-5 py-3 rounded-full bg-bg/10 border border-bg/20 text-bg placeholder-bg/50 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button className="w-full sm:w-auto px-7 py-3 rounded-full bg-accent text-[#111111] text-sm font-semibold hover:bg-accent/90 transition-colors">
            Subscribe
          </button>
        </div>
        <p className="text-bg/40 text-xs">
          Or{' '}
          <Link
            href="/sign-up"
            className="underline text-accent hover:text-accent/80"
          >
            create a free account
          </Link>{' '}
          to start tracking immediately.
        </p>
      </div>
    </section>
  );
}
