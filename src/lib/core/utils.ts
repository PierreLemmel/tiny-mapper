export function cn(...classes: (string|boolean|undefined|null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function createId(): string {
    return crypto.randomUUID();
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}