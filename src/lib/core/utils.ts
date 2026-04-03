export function cn(...classes: (string|boolean|undefined|null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function createId(): string {
    return crypto.randomUUID();
}

export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(value, max));
}

export function clamp01(value: number): number {
    return clamp(value, 0, 1);
}

export function positiveModulo(n: number, m: number): number {
    return ((n % m) + m) % m;
}

export function circularClamp(value: number, min: number, max: number): number {
    return positiveModulo(value - min, max - min) + min;
}

export function inverseLerp(value: number, min: number, max: number): number {
    return (value - min) / (max - min);
}

export function degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

export function isWithinArray(array: any[], index: number): boolean {
    return index >= 0 && index < array.length;
}

export function remap(value: number, min: number, max: number, newMin: number, newMax: number): number {
    return newMin + (value - min) * (newMax - newMin) / (max - min);
}