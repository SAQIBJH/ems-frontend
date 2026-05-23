import type { ReactNode } from 'react';

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left — form area */}
      <div className="flex flex-1 flex-col">
        {/* Logo */}
        <header className="shrink-0 px-8 pt-8 pb-0">
          <span className="text-xl font-bold tracking-tight text-fg">
            <span className="text-brand">E</span>MS
          </span>
        </header>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[480px]">{children}</div>
        </div>
      </div>

      {/* Right — product panel (desktop only) */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-brand p-12 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(0 0% 100%) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-sm text-center">
          <div className="text-4xl font-bold text-white tracking-tight mb-4">
            Employee Management
          </div>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            Streamline HR operations, manage your workforce, and make data-driven decisions — all in
            one place.
          </p>
          <ul className="space-y-3 text-left">
            {[
              'Real-time attendance tracking',
              'Leave management & approvals',
              'Role-based access control',
              'Department org charts',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-white/80 text-sm">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg viewBox="0 0 12 12" fill="none" className="size-3">
                    <path
                      d="M2 6l2.5 2.5L10 3.5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
