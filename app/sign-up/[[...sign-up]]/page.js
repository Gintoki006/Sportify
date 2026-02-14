import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Sportify
          </h1>
          <p className="text-muted mt-2 text-sm">
            Create your account and start tracking
          </p>
        </div>

        {/* Clerk Sign-Up Widget */}
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-surface border border-border shadow-lg rounded-2xl',
              headerTitle: 'text-primary font-bold',
              headerSubtitle: 'text-muted',
              socialButtonsBlockButton:
                'border border-border bg-surface text-primary hover:bg-bg transition-colors',
              formFieldLabel: 'text-primary text-sm font-medium',
              formFieldInput:
                'bg-bg border border-border text-primary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent',
              formButtonPrimary:
                'bg-accent text-black font-semibold hover:opacity-90 transition-opacity rounded-lg',
              footerActionLink: 'text-accent hover:underline font-medium',
              dividerLine: 'bg-border',
              dividerText: 'text-muted',
            },
          }}
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/onboarding"
        />
      </div>
    </div>
  );
}
