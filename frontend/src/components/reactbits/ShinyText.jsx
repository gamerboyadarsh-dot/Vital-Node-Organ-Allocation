/**
 * ShinyText — React Bits (reactbits.dev)
 * Elegant metallic/luminous light reflection sweep across text.
 */
export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
}) {
  return (
    <span
      className={`inline-block select-none font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-200 via-white to-neutral-400 ${
        !disabled ? 'animate-shiny-text' : ''
      } ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 1) 40%, rgba(56, 189, 248, 1) 50%, rgba(255, 255, 255, 1) 60%, rgba(255, 255, 255, 0.4) 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  );
}
