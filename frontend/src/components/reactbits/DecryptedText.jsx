import { useState, useEffect, useRef } from 'react';

/**
 * DecryptedText — React Bits (reactbits.dev)
 * Cyber-medical decipher text animation with customizable characters and speed.
 */
export default function DecryptedText({
  text = '',
  speed = 35,
  maxIterations = 12,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~|}{[]:;?><',
  className = '',
  parentClassName = '',
  animateOn = 'hover', // 'hover' | 'view'
  revealDirection = 'start', // 'start' | 'end' | 'center'
  ...props
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);

  const startAnimation = () => {
    let iteration = 0;
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(intervalRef.current);
      }

      iteration += 1 / (maxIterations / text.length || 1);
    }, speed);
  };

  useEffect(() => {
    setDisplayText(text);
    if (animateOn === 'view' && !hasAnimated) {
      startAnimation();
      setHasAnimated(true);
    }
    return () => clearInterval(intervalRef.current);
  }, [text]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      setIsHovered(true);
      startAnimation();
    }
  };

  const handleMouseLeave = () => {
    if (animateOn === 'hover') {
      setIsHovered(false);
    }
  };

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-block cursor-default font-mono ${parentClassName}`}
      {...props}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
}
