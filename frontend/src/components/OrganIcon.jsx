import React from 'react';

/**
 * OrganIcon — Clinical Anatomical SVG Iconography
 * Provides accurate medical silhouettes for Kidney, Liver, Lung, Heart, Pancreas, and Cornea.
 */

export function KidneyIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Anatomical bean shape with medial hilum */}
      <path
        d="M13 3C8.5 3 5.5 6.5 5.5 11C5.5 15.5 8 19 12 21C14 21 15.5 19.5 15.5 17.5C15.5 15.8 14 14.5 14 13C14 11.5 18.5 12 18.5 8.5C18.5 5.5 16.5 3 13 3Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Renal Hilum & Pelvis internal contour */}
      <path
        d="M12 10.5C10.5 11.2 10.5 12.8 11.8 13.5"
        strokeWidth="1.5"
        strokeDasharray="1.2 1.2"
        opacity="0.8"
      />
      {/* Descending Ureter tube */}
      <path
        d="M13.8 14.2C13.5 16.5 12.2 18.5 12.2 22"
        strokeWidth="1.6"
        opacity="0.75"
      />
      {/* Renal Artery entrance dot */}
      <circle cx="13" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LungIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Trachea & Cartilage Rings */}
      <path d="M12 2V8.5" />
      <path d="M10 3.8H14" strokeWidth="1.5" />
      <path d="M10 6.2H14" strokeWidth="1.5" />

      {/* Mainstem Bronchi */}
      <path d="M12 8.5L9.5 11" />
      <path d="M12 8.5L14.5 11" />

      {/* Right Lung (anatomical right / visual left) */}
      <path
        d="M9.5 10.5C7 10.5 4.5 12 4.5 15.5C4.5 19 6 21.5 8.5 21.5C10.5 21.5 11 19.5 11 18V12C11 11 10.5 10.5 9.5 10.5Z"
        fill="currentColor"
        fillOpacity="0.18"
      />

      {/* Left Lung (anatomical left / visual right with cardiac notch) */}
      <path
        d="M14.5 10.5C17 10.5 19.5 12 19.5 15.5C19.5 19 18 21.5 15.5 21.5C13.8 21.5 13 20 13 18.5C13 16.5 14 15.5 13.5 13.5V12C13.5 11 14 10.5 14.5 10.5Z"
        fill="currentColor"
        fillOpacity="0.18"
      />

      {/* Bronchial arborization accents */}
      <path d="M7.5 14.5L6.5 16.5" strokeWidth="1.2" opacity="0.6" />
      <path d="M16.5 14.5L17.5 16.5" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

export function LiverIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Hepatic lobe perimeter: broad right dome, inferior margin, left tapering wedge */}
      <path
        d="M3.5 11.5C3.5 7.5 7 4.5 12 4.5C17.5 4.5 20.5 7 20.5 11.5C20.5 15.5 18 18.5 14.5 18.5C12 18.5 10 17 8.5 15.5L3.5 11.5Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Falciform ligament dividing right and left lobes */}
      <path
        d="M13 5C12.5 8 11.5 11.5 10 15"
        strokeWidth="1.5"
        strokeDasharray="1.5 1.5"
        opacity="0.75"
      />
      {/* Gallbladder / Porta hepatis notch */}
      <path d="M9.5 16.5C10.2 17.8 11.5 18.5 12.5 18.5" strokeWidth="1.6" />
      <circle cx="10" cy="16.5" r="1.2" fill="currentColor" stroke="none" opacity="0.85" />
    </svg>
  );
}

export function HeartIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Superior Vena Cava and Aortic Arch branches */}
      <path d="M9 3.5V1.8" strokeWidth="1.8" />
      <path d="M12 3.5V1.2" strokeWidth="2" />
      <path d="M15 3.5V2" strokeWidth="1.8" />

      {/* Clinical Cardiac chamber silhouette */}
      <path
        d="M12 21.2L10.5 19.8C5.4 15.2 2 12.1 2 8.3C2 5.2 4.4 2.8 7.5 2.8C9.2 2.8 10.9 3.6 12 4.9C13.1 3.6 14.8 2.8 16.5 2.8C19.6 2.8 22 5.2 22 8.3C22 12.1 18.6 15.2 13.5 19.8L12 21.2Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Interventricular septum line */}
      <path d="M12 7.5V16" strokeDasharray="1.5 1.5" opacity="0.6" strokeWidth="1.4" />
    </svg>
  );
}

export function PancreasIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Pancreas head, body and tapering tail */}
      <path
        d="M20.5 10C20.5 7.5 18.5 6 16 6C13.5 6 12 7.5 10 8.5C7.5 9.5 5 9 3 11C1.5 12.5 1.5 15 3 16.5C5 18 7.5 17.5 10 16.5C12.5 15.5 14.5 15 17 15C19.5 15 20.5 13 20.5 10Z"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Main Pancreatic Duct */}
      <path d="M4.5 13.5C8 13.5 11 11.5 15 11.5C17.5 11.5 19 10 19 10" strokeDasharray="1.2 1.2" opacity="0.75" />
      {/* Duodenum C-loop head curve */}
      <circle cx="4" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CorneaIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Eye contour */}
      <path
        d="M2 12C2 12 5.5 5.5 12 5.5C18.5 5.5 22 12 22 12C22 12 18.5 18.5 12 18.5C5.5 18.5 2 12 2 12Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Iris and Pupil */}
      <circle cx="12" cy="12" r="3.5" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Specular Cornea Curvature highlight */}
      <path d="M10 8.5C10.8 7.8 12 7.5 13 7.8" strokeWidth="1.5" opacity="0.9" />
    </svg>
  );
}

/**
 * Universal Organ Icon Resolver
 */
export default function OrganIcon({ organ, className = "w-5 h-5", ...props }) {
  const norm = (organ || '').toLowerCase().trim();

  if (norm.includes('kidney')) {
    return <KidneyIcon className={className} {...props} />;
  }
  if (norm.includes('lung')) {
    return <LungIcon className={className} {...props} />;
  }
  if (norm.includes('liver')) {
    return <LiverIcon className={className} {...props} />;
  }
  if (norm.includes('heart')) {
    return <HeartIcon className={className} {...props} />;
  }
  if (norm.includes('pancreas')) {
    return <PancreasIcon className={className} {...props} />;
  }
  if (norm.includes('cornea') || norm.includes('eye')) {
    return <CorneaIcon className={className} {...props} />;
  }

  // Fallback generic kidney
  return <KidneyIcon className={className} {...props} />;
}
