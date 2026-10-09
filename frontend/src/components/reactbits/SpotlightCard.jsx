import { useRef, useState } from 'react';

/**
 * SpotlightCard — React Bits (reactbits.dev)
 * Interactive card with cursor-following radial light beam and dynamic border illumination.
 */
export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(56, 189, 248, 0.16)',
  borderColor = 'rgba(56, 189, 248, 0.4)',
  radius = 350,
  ...props
}) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border border-line bg-surface-1/90 transition-all duration-200 ${className}`}
      {...props}
    >
      {/* Radial Spotlight Beam */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(${radius}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />

      {/* Dynamic Luminous Border Highlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl border opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          borderColor: borderColor,
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
