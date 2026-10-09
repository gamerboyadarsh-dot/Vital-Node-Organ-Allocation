export default function VitalNodeLogo({
  size = 36,
  animated = true,
  showText = true,
  subtitle = "ALLOCATION NETWORK",
  className = ""
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Particular Custom Emblem: Hexagonal Bio-Node with Integrated Vital Pulse */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(76,139,245,0.35)]"
        >
          {/* Hexagonal Outer Shield */}
          <polygon
            points="24,3 43,14 43,34 24,45 5,34 5,14"
            fill="#161B22"
            stroke="url(#hexGradient)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Internal Tri-Node Connectivity (Organ Network Graph) */}
          <line x1="24" y1="13" x2="14" y2="31" stroke="#2A323D" strokeWidth="1.8" />
          <line x1="24" y1="13" x2="34" y2="31" stroke="#2A323D" strokeWidth="1.8" />
          <line x1="14" y1="31" x2="34" y2="31" stroke="#2A323D" strokeWidth="1.8" />

          {/* ECG Pulse Overlay through the center */}
          <path
            d="M 10,25 L 18,25 L 21,17 L 24,32 L 27,22 L 30,25 L 38,25"
            fill="none"
            stroke="#4C8BF5"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={animated ? "animate-pulse" : ""}
          />

          {/* Apex Nodes */}
          <circle cx="24" cy="13" r="3.2" fill="#E5484D" className={animated ? "animate-ping" : ""} opacity="0.35" />
          <circle cx="24" cy="13" r="2.8" fill="#E5484D" />
          <circle cx="14" cy="31" r="2.8" fill="#3E9B6F" />
          <circle cx="34" cy="31" r="2.8" fill="#4C8BF5" />

          {/* Center Synapse Core */}
          <circle cx="24" cy="25" r="1.8" fill="#FFFFFF" />

          {/* Gradients */}
          <defs>
            <linearGradient id="hexGradient" x1="5" y1="3" x2="43" y2="45" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4C8BF5" />
              <stop offset="50%" stopColor="#3E9B6F" />
              <stop offset="100%" stopColor="#E5484D" />
            </linearGradient>
          </defs>
        </svg>

        {/* Ambient Core Glow */}
        {animated && (
          <div className="absolute inset-1 rounded-full bg-signal-info/10 blur-sm pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="leading-tight select-none">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-white text-base tracking-tight font-sans">
              Vital<span className="text-signal-info">Node</span>
            </span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-2 border border-line text-signal-stable font-semibold">
              v3.2
            </span>
          </div>
          {subtitle && (
            <span className="block text-[9px] font-mono text-ink-secondary tracking-widest uppercase mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
