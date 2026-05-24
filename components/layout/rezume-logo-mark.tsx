const INK = "#1a1a1a";
const STROKE = 2.5;

export function RezumeLogoMark() {
  return (
    <>
      <rect
        x="15"
        y="13"
        width="26"
        height="30"
        rx="3.5"
        fill="#ffd6b3"
        stroke={INK}
        strokeWidth={STROKE}
      />
      <rect
        x="11"
        y="9"
        width="26"
        height="30"
        rx="3.5"
        fill="#c7b8ea"
        stroke={INK}
        strokeWidth={STROKE}
      />
      <rect
        x="7"
        y="5"
        width="26"
        height="30"
        rx="3.5"
        fill="#b5ead7"
        stroke={INK}
        strokeWidth={STROKE}
      />
      <rect x="12" y="11" width="10" height="5" rx="1.5" fill={INK} />
      <rect x="12" y="19" width="16" height="2" rx="1" fill={INK} />
      <rect x="12" y="24" width="12" height="2" rx="1" fill={INK} />
      <rect x="12" y="29" width="14" height="2" rx="1" fill={INK} />
      <circle
        cx="36"
        cy="10"
        r="6"
        fill="#fff3b0"
        stroke={INK}
        strokeWidth={STROKE}
      />
      <path
        d="M36 7.5 L36.6 9.2 L38.4 9.2 L37 10.2 L37.6 12 L36 11 L34.4 12 L35 10.2 L33.6 9.2 L35.4 9.2 Z"
        fill={INK}
      />
    </>
  );
}
