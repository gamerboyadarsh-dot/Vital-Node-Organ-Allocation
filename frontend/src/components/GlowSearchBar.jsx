import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

/**
 * GlowSearchBar — From Uiverse.io by Lakshay-art
 * Multi-layer conic gradient glowing search bar adapted to VitalNode's medical dark palette.
 *
 * @param {string} value - Current search query
 * @param {function} onChange - Handler for query changes
 * @param {function} onClear - Optional clear handler
 * @param {string} placeholder - Placeholder text
 * @param {string} className - Wrapper styling
 */
export default function GlowSearchBar({
  value = '',
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  id,
  name,
}) {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`glow-search-poda ${className}`}>
      {/* 4 Multi-layered animated conic background & blur rings */}
      <div className="glow-search-glow" aria-hidden="true" />
      <div className="glow-search-dark-border-bg" aria-hidden="true" />
      <div className="glow-search-white" aria-hidden="true" />
      <div className="glow-search-border" aria-hidden="true" />

      {/* Main input container */}
      <div className="glow-search-main">
        {/* Ambient cyan reflection mask */}
        <div className="glow-search-flare" aria-hidden="true" />

        {/* Search Icon */}
        <div className="glow-search-search-icon">
          <Search className="w-3.5 h-3.5" />
        </div>

        {/* Input */}
        <input
          id={id}
          name={name}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="glow-search-input font-mono"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Filter or Clear button */}
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            className="glow-search-filter-icon text-ink-secondary hover:text-signal-critical"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div
            className="glow-search-filter-icon text-cyan-400/70 pointer-events-none"
            title="Filter active"
          >
            <SlidersHorizontal className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
}
