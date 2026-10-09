export default function Skeleton({ className = "", count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`shimmer-box rounded border border-line ${className}`}
        />
      ))}
    </>
  );
}
