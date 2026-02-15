'use client';

import Image from 'next/image';

export default function ProfileStep({ profile, onChange, clerkUser }) {
  const handleChange = (field, value) => {
    onChange({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-medium text-accent uppercase tracking-wider mb-2">
          Step 2 of 3
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-primary">
          Set Up Your Profile
        </h2>
        <p className="text-muted mt-2 text-sm sm:text-base">
          Tell us a bit about yourself.
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          {clerkUser?.avatarUrl ? (
            <Image
              src={clerkUser.avatarUrl}
              alt="Avatar"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-accent/30"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent/20 border-4 border-accent/30 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl">
                {profile.name
                  ? profile.name.charAt(0).toUpperCase()
                  : '👤'}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-accent rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <p className="text-xs text-muted">
          Avatar synced from your sign-in provider
        </p>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="onboard-name"
            className="block text-sm font-medium text-primary mb-1.5"
          >
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            id="onboard-name"
            type="text"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
          />
        </div>

        {/* Bio */}
        <div>
          <label
            htmlFor="onboard-bio"
            className="block text-sm font-medium text-primary mb-1.5"
          >
            Bio{' '}
            <span className="text-muted font-normal text-xs">(optional)</span>
          </label>
          <textarea
            id="onboard-bio"
            rows={3}
            value={profile.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            placeholder="A short bio about your sports journey..."
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-primary placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all resize-none"
          />
          <p className="text-xs text-muted mt-1 text-right">
            {profile.bio.length}/200
          </p>
        </div>
      </div>
    </div>
  );
}
