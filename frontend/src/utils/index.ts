import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract up to 2 uppercase initials from a citizen's full name.
 */
export function getInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ""
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Normalize all-uppercase names (e.g. "KUNAL KISHORE") to Title Case
 * while preserving intentional mixed-case formatting.
 */
export function formatDisplayName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ""
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .replace(/\b\w/g, (ch) => ch.toUpperCase())
  }
  return trimmed
}
