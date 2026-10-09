import { useEffect, useRef } from 'react';

/**
 * ClickSpark — React Bits (reactbits.dev)
 * Multi-spark burst particle physics that trigger at cursor click position.
 */
export default function ClickSpark({
  sparkColor = '#38BDF8',
  sparkSize = 10,
  sparkRadius = 25,
  sparkCount = 8,
  duration = 450,
  children,
}) {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        const currentRadius = spark.radius * Math.sin((progress * Math.PI) / 2);
        const currentAlpha = 1 - progress;

        const x = spark.x + Math.cos(spark.angle) * currentRadius;
        const y = spark.y + Math.sin(spark.angle) * currentRadius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, spark.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = spark.color;
        ctx.fill();
        ctx.restore();

        return true;
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleClick = (e) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.5;
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle,
          radius: sparkRadius + Math.random() * 15,
          size: sparkSize * (0.6 + Math.random() * 0.8),
          color: i % 2 === 0 ? sparkColor : '#10B981',
          startTime: now,
        });
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('click', handleClick);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />
      {children}
    </>
  );
}
