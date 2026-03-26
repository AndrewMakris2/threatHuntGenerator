import React from 'react';

/**
 * PhantomLogo — SVG ghost/phantom hunter brand icon
 * Sizes: 'sm' (24px), 'md' (32px), 'lg' (48px), 'xl' (64px), number for custom px
 */
export default function PhantomLogo({ size = 'md', className = '', glow = false }) {
  const px = typeof size === 'number' ? size
    : { sm: 24, md: 32, lg: 48, xl: 64, '2xl': 96 }[size] || 32;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 8px rgba(220,38,38,0.7))' } : {}}
      aria-label="Phantom Hunter logo"
    >
      {/* ── Ghost body ── */}
      <path
        d="M50 6
           C 28 6, 12 24, 12 48
           L 12 96
           Q 19 84, 27 96
           Q 35 84, 43 96
           Q 50 84, 57 96
           Q 65 84, 73 96
           Q 81 84, 88 96
           L 88 48
           C 88 24, 72 6, 50 6 Z"
        fill="#1a1a1a"
        stroke="#dc2626"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* ── Inner body subtle gradient overlay ── */}
      <path
        d="M50 10
           C 30 10, 16 27, 16 48
           L 16 88
           Q 22 78, 27 88
           Q 35 78, 43 88
           Q 50 78, 57 88
           Q 65 78, 73 88
           Q 78 78, 84 88
           L 84 48
           C 84 27, 70 10, 50 10 Z"
        fill="url(#ghostGrad)"
        opacity="0.4"
      />

      {/* ── Left eye white ── */}
      <ellipse cx="36" cy="50" rx="9" ry="11" fill="white" opacity="0.92" />
      {/* ── Right eye white ── */}
      <ellipse cx="64" cy="50" rx="9" ry="11" fill="white" opacity="0.92" />

      {/* ── Left pupil (red glowing) ── */}
      <ellipse cx="38" cy="52" rx="5.5" ry="7" fill="#dc2626" />
      <ellipse cx="39" cy="50" rx="2" ry="3" fill="#ff6b6b" opacity="0.7" />

      {/* ── Right pupil (red glowing) ── */}
      <ellipse cx="66" cy="52" rx="5.5" ry="7" fill="#dc2626" />
      <ellipse cx="67" cy="50" rx="2" ry="3" fill="#ff6b6b" opacity="0.7" />

      {/* ── Subtle crosshair on left eye ── */}
      <line x1="36" y1="43" x2="36" y2="57" stroke="#dc2626" strokeWidth="1" opacity="0.4" />
      <line x1="29" y1="50" x2="43" y2="50" stroke="#dc2626" strokeWidth="1" opacity="0.4" />

      {/* ── Gradient def ── */}
      <defs>
        <radialGradient id="ghostGrad" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/**
 * PhantomWordmark — full horizontal logo: icon + "PHANTOM HUNTER" text
 */
export function PhantomWordmark({ iconSize = 32, className = '' }) {
  return (
    <div className={`phantom-wordmark ${className}`} style={{ display:'flex', alignItems:'center', gap: 10 }}>
      <PhantomLogo size={iconSize} glow />
      <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }}>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          fontSize: iconSize * 0.55,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#f5f5f5',
        }}>
          Phantom
        </span>
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: iconSize * 0.42,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#dc2626',
        }}>
          Hunter
        </span>
      </div>
    </div>
  );
}
