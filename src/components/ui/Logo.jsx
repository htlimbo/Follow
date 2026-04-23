/**
 * FollowMind Arc Dot Logo
 *
 * Usage:
 *   <Logo />              — mark only (for nav/header, uses currentColor)
 *   <Logo withBg />       — dark square carrier (for Rail/sidebar brand)
 *   <Logo size={24} />    — custom size
 */
export function Logo({ size = 22, withBg = false }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M4 24 C 12 24, 17 14, 26 9"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="26" cy="9" r="3.5" fill="var(--accent)" />
      <circle cx="4" cy="24" r="1.6" fill="currentColor" />
    </svg>
  );

  if (withBg) {
    return (
      <div
        className="grid place-items-center rounded-[10px]"
        style={{
          width: size * 1.64,
          height: size * 1.64,
          background: 'var(--ink)',
          color: 'var(--bg)',
        }}
      >
        {svg}
      </div>
    );
  }

  return svg;
}

/**
 * Wordmark: Arc Dot + "FollowMind"
 *   <Wordmark />
 *   <Wordmark size={20} textClass="text-xl" />
 */
export function Wordmark({ size = 20, textClass = 'text-base' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span style={{ color: 'var(--accent)' }}>
        <Logo size={size} />
      </span>
      <span className={`font-semibold tracking-tight ${textClass}`}>
        FollowMind
      </span>
    </span>
  );
}
