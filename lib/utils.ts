import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatYearLabel(classYear: string): string {
  return /^\d{4}$/.test(classYear) ? `Class of ${classYear}` : classYear;
}
