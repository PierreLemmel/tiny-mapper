import { generateUUID } from "three/src/math/MathUtils.js";

export function cn(...classes: (string|boolean|undefined|null)[]): string {
    return classes.filter(Boolean).join(' ');
}

export function createId(): string {
    return generateUUID()
}