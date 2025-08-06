import React from 'react'

const createIcon = (path, viewBox = "0 0 24 24") => {
  return ({ className = "w-4 h-4", ...props }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {path}
    </svg>
  )
}

export const Mic = createIcon(
  <path d="m12 1 0 10c0 2.2-1.8 4-4 4s-4-1.8-4-4V7c0-2.2 1.8-4 4-4s4 1.8 4 4z" />
)

export const MicOff = createIcon(
  <>
    <line x1="1" x2="23" y1="1" y2="23" />
    <path d="m9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" x2="12" y1="19" y2="23" />
    <line x1="8" x2="16" y1="23" y2="23" />
  </>
)

export const Volume2 = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </>
)

export const VolumeX = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="22" x2="16" y1="9" y2="15" />
    <line x1="16" x2="22" y1="9" y2="15" />
  </>
)

export const Volume1 = createIcon(
  <>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </>
)

export const Headphones = createIcon(
  <>
    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
  </>
)

export const AlertCircle = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </>
)

export const Play = createIcon(
  <polygon points="5 3 19 12 5 21 5 3" />
)

export const Pause = createIcon(
  <>
    <rect width="4" height="16" x="6" y="4" />
    <rect width="4" height="16" x="14" y="4" />
  </>
)

export const Sun = createIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </>
)

export const Moon = createIcon(
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
)

export const Info = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>
)

export const Zap = createIcon(
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
)

export const Shield = createIcon(
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
)

export const Waves = createIcon(
  <>
    <path d="m2 6 3 6L8 6l3 6 3-6" />
    <path d="m17 6-3 6-3-6-3 6-3-6" />
    <path d="m2 12 3 6L8 12l3 6 3-6" />
    <path d="m17 12-3 6-3-6-3 6-3-6" />
  </>
)

export const Filter = createIcon(
  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
)
