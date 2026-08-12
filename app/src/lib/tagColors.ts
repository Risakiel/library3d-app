const TAG_COLOR_CLASSES = {
  RED: "bg-red-500/15 text-red-600 dark:text-red-400",
  GREEN: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  BLUE: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
} as const;

export function tagColorClass(color: keyof typeof TAG_COLOR_CLASSES) {
  return TAG_COLOR_CLASSES[color];
}
