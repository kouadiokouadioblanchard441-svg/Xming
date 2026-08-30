import React from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

/** Cadenas gras avec trou de serrure — fidèle à la maquette */
export function LockBoldIcon({ size = 22, color = "currentColor", className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shackle (arc du dessus) */}
      <path
        d="M14 22V16C14 9.925 18.477 5 24 5C29.523 5 34 9.925 34 16V22"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Corps du cadenas */}
      <rect
        x="7"
        y="22"
        width="34"
        height="24"
        rx="4"
        stroke={color}
        strokeWidth="4"
        fill="none"
      />
      {/* Trou de serrure — cercle */}
      <circle cx="24" cy="33" r="4" fill={color} />
      {/* Trou de serrure — encoche vers le bas */}
      <rect x="22" y="35" width="4" height="5" rx="1" fill={color} />
    </svg>
  );
}

/** Icône téléphone/smartphone — sera remplacée par le vrai asset */
export function PhoneBoldIcon({ size = 22, color = "currentColor", className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Corps du téléphone */}
      <rect
        x="10"
        y="4"
        width="28"
        height="40"
        rx="5"
        stroke={color}
        strokeWidth="4"
        fill="none"
      />
      {/* Bouton home / encoche bas */}
      <circle cx="24" cy="39" r="2.5" fill={color} />
      {/* Haut-parleur */}
      <rect x="19" y="9" width="10" height="2.5" rx="1.25" fill={color} />
    </svg>
  );
}
