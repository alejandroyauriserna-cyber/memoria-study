import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
