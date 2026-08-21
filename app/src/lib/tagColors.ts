const TAG_COLOR_CLASSES = {
  RED: "bg-red-500/15 text-red-600 dark:text-red-400",
  GREEN: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  BLUE: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
} as const;

export function tagColorClass(color: keyof typeof TAG_COLOR_CLASSES) {
  return TAG_COLOR_CLASSES[color];
}

// Variante a fond noir opaque, pour les badges affiches par-dessus une photo
// (le fond teinte translucide de tagColorClass y est illisible).
const TAG_COLOR_SOLID_CLASSES = {
  RED: "bg-black/70 text-red-400",
  GREEN: "bg-black/70 text-emerald-400",
  BLUE: "bg-black/70 text-blue-400",
} as const;

export function tagColorSolidClass(color: keyof typeof TAG_COLOR_SOLID_CLASSES) {
  return TAG_COLOR_SOLID_CLASSES[color];
}
