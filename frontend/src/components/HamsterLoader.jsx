import React from 'react';

/**
 * HamsterLoader — From Uiverse.io by Nawsome
 * A delightful animated hamster powering a spinning wheel.
 *
 * @param {'xs' | 'sm' | 'md' | 'lg' | 'xl' | number} size - Predefined size or custom pixel font-size
 * @param {number | string} speed - Duration of the wheel cycle (e.g. 1 or '0.8s')
 * @param {string} className - Additional container styling
 */
export default function HamsterLoader({
  size = 'md',
  speed = '1s',
  className = '',
  style = {},
}) {
  const getFontSize = () => {
    if (typeof size === 'number') return `${size}px`;
    switch (size) {
      case 'xs':
        return '6px';
      case 'sm':
        return '8px';
      case 'md':
        return '11px';
      case 'lg':
        return '14px';
      case 'xl':
        return '18px';
      default:
        return '11px';
    }
  };

  const durValue = typeof speed === 'number' ? `${speed}s` : speed;

  return (
    <div
      aria-label="Orange and tan hamster running in a metal wheel"
      role="img"
      className={`wheel-and-hamster ${className}`}
      style={{
        fontSize: getFontSize(),
        '--dur': durValue,
        ...style,
      }}
    >
      <div className="wheel" />
      <div className="hamster">
        <div className="hamster__body">
          <div className="hamster__head">
            <div className="hamster__ear" />
            <div className="hamster__eye" />
            <div className="hamster__nose" />
          </div>
          <div className="hamster__limb hamster__limb--fr" />
          <div className="hamster__limb hamster__limb--fl" />
          <div className="hamster__limb hamster__limb--br" />
          <div className="hamster__limb hamster__limb--bl" />
          <div className="hamster__tail" />
        </div>
      </div>
      <div className="spoke" />
    </div>
  );
}
