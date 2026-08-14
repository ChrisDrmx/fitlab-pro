export function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-label="FitLab Pro"
      role="img"
    >
      {/* cible de dispersion */}
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.4" opacity="0.35" />
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
      {/* axe de lie / face angle */}
      <path d="M4 27 L28 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* point d'impact */}
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
    </svg>
  );
}
