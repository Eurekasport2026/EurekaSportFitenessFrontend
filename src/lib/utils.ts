/** Combine optional CSS classes without adding a runtime dependency. */
export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
