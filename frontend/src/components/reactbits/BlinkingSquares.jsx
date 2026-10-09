import { useEffect, useRef } from 'react';

/**
 * Blinking Squares — React Bits Pro (@reactbits-starter/blinking-squares-tw)
 * A grid of little squares that quietly twinkle along a configurable direction gradient.
 *
 * Official Props & Defaults:
 * @param {'right' | 'left' | 'top' | 'bottom'} direction - Edge the dense squares are anchored to (default: 'right')
 * @param {number} gridSize - Number of cells along the long axis (8–200, default: 52)
 * @param {number} squareSize - Constant square fill % within cell (0.05–0.98, default: 0.57)
 * @param {number} fadeStart - Where field first becomes non-empty (0–1, default: 0.65)
 * @param {number} fadeEnd - Where field reaches full density (0–1, default: 1)
 * @param {number} falloff - Sharpness curve between fadeStart & fadeEnd (default: 1.25)
 * @param {number} minBrightness - Minimum brightness of lit cell (0–1, default: 0.55)
 * @param {number} twinkleSpeed - Per-cell twinkle rate in cycles/sec (default: 1.4)
 * @param {number} twinkleStrength - Strength of brightness oscillation (0–1, default: 0.94)
 * @param {number} intensity - Master brightness multiplier (0–2, default: 1)
 * @param {number} opacity - Master alpha (0–1, default: 1)
 * @param {string} squareColor - Color of twinkling squares (default: '#38BDF8')
 * @param {string} backgroundColor - Background fill color or transparent (default: 'transparent')
 * @param {number} dpr - Max device pixel ratio cap (1–3, default: 1.5)
 * @param {string} className - Additional CSS classes
 */

// Deterministic cell hash for stable density check
function cellHash(c, r) {
  let h = (c * 374761393 + r * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Deterministic phase hash for smooth per-cell phase offsets
function phaseHash(c, r) {
  let h = (c * 668265263 + r * 374761393) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export default function BlinkingSquares({
  direction = 'right',
  gridSize = 52,
  squareSize = 0.57,
  fadeStart = 0.65,
  fadeEnd = 1,
  falloff = 1.25,
  minBrightness = 0.55,
  twinkleSpeed = 1.4,
  twinkleStrength = 0.94,
  intensity = 1,
  opacity = 1,
  squareColor = '#38BDF8',
  backgroundColor = 'transparent',
  dpr = 1.5,
  className = '',
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const updateDimensions = () => {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : { width: 300, height: 150 };
      width = Math.max(rect.width, 10);
      height = Math.max(rect.height, 10);
      pixelRatio = Math.min(window.devicePixelRatio || 1, Math.max(1, dpr));

      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const render = () => {
      if (width <= 0 || height <= 0) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Background fill or clear
      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Calculate grid metrics based on long axis
      const longAxis = Math.max(width, height);
      const safeGridSize = Math.max(8, Math.min(200, gridSize));
      const cellSize = longAxis / safeGridSize;
      const cols = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      const fillPercent = Math.max(0.05, Math.min(0.98, squareSize));
      const sqSize = cellSize * fillPercent;
      const offset = (cellSize - sqSize) / 2;

      const timeSec = performance.now() / 1000;
      const safeFadeStart = Math.min(fadeStart, fadeEnd - 0.001);
      const fadeSpan = Math.max(0.001, fadeEnd - safeFadeStart);

      ctx.fillStyle = squareColor;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          // Calculate normalized distance 't' towards the dense edge [0, 1]
          let t = 0;
          if (direction === 'right') {
            t = (c + 0.5) / cols;
          } else if (direction === 'left') {
            t = 1 - (c + 0.5) / cols;
          } else if (direction === 'bottom') {
            t = (r + 0.5) / rows;
          } else if (direction === 'top') {
            t = 1 - (r + 0.5) / rows;
          }

          // Compute density along the gradient curve
          let density = 0;
          if (t >= safeFadeStart) {
            const progress = Math.min(1, Math.max(0, (t - safeFadeStart) / fadeSpan));
            density = Math.pow(progress, falloff);
          }

          // Deterministic existence threshold
          if (density <= 0 || cellHash(c, r) > density) {
            continue;
          }

          // Per-cell twinkle oscillation
          const phase = phaseHash(c, r) * Math.PI * 2;
          const speedVar = 0.85 + cellHash(c * 3, r * 3) * 0.3;
          const wave = 0.5 + 0.5 * Math.sin(timeSec * twinkleSpeed * Math.PI * 2 * speedVar + phase);

          const oscillation = 1 - twinkleStrength * (1 - wave);
          const brightness = minBrightness + (1 - minBrightness) * oscillation;
          const alpha = Math.min(Math.max(opacity * intensity * brightness, 0), 1);

          ctx.globalAlpha = alpha;
          ctx.fillRect(
            (c * cellSize + offset) * pixelRatio,
            (r * cellSize + offset) * pixelRatio,
            sqSize * pixelRatio,
            sqSize * pixelRatio
          );
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [
    direction,
    gridSize,
    squareSize,
    fadeStart,
    fadeEnd,
    falloff,
    minBrightness,
    twinkleSpeed,
    twinkleStrength,
    intensity,
    opacity,
    squareColor,
    backgroundColor,
    dpr,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 block h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
