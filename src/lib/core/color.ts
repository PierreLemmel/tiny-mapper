import * as THREE from "three";

export const PRIMARY_COLOR: RawColor = [0, 0.898, 1, 1];
export const SECONDARY_COLOR: RawColor = [0.486, 0.302, 1, 1];
export const NEUTRAL_COLOR: RawColor = [0.016, 0.016, 0.0175, 1];

export type RawColor = [number, number, number, number]

export interface HSVA {
    h: number;
    s: number;
    v: number;
    a: number;
}

export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

export function hsvaToRgba(hsva: HSVA): RGBA {
    const h = hsva.h / 360;
    const s = hsva.s / 100;
    const v = hsva.v / 100;

    let r: number, g: number, b: number;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0;
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
        a: hsva.a,
    };
}

export function rgbaToHsva(rgba: RGBA): HSVA {
    const r = rgba.r / 255;
    const g = rgba.g / 255;
    const b = rgba.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        v: Math.round(v * 100),
        a: rgba.a,
    };
}

export function rgbaToHex(rgba: RGBA, includeAlpha = true): string {
    const r = rgba.r.toString(16).padStart(2, '0');
    const g = rgba.g.toString(16).padStart(2, '0');
    const b = rgba.b.toString(16).padStart(2, '0');

    if (includeAlpha && rgba.a < 1) {
        const a = Math.round(rgba.a * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}${a}`;
    }

    return `#${r}${g}${b}`;
}

export function hexToRgba(hex: string): RGBA | null {
    let cleaned = hex.replace(/^#/, '');

    if (cleaned.length === 3) {
        cleaned = cleaned.split('').map(c => c + c).join('');
    } else if (cleaned.length === 4) {
        cleaned = cleaned.split('').map(c => c + c).join('');
    }

    if (cleaned.length !== 6 && cleaned.length !== 8) return null;

    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    const a = cleaned.length === 8 ? parseInt(cleaned.substring(6, 8), 16) / 255 : 1;

    if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;

    return { r, g, b, a: Math.round(a * 100) / 100 };
}

export function hueToRgbString(hue: number): string {
    const rgba = hsvaToRgba({ h: hue, s: 100, v: 100, a: 1 });
    return `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`;
}

export function rawColorToRgba(raw: RawColor): RGBA {
    return { r: raw[0] * 255, g: raw[1] * 255, b: raw[2] * 255, a: raw[3] };
}

export function rgbaToRawColor(rgba: RGBA): RawColor {
    return [rgba.r/255, rgba.g/255, rgba.b/255, rgba.a];
}

export function rawColorToHsva(raw: RawColor): HSVA {
    return rgbaToHsva(rawColorToRgba(raw));
}

export function hsvaToRawColor(hsva: HSVA): RawColor {
    return rgbaToRawColor(hsvaToRgba(hsva));
}

export function rawColorToHex(raw: RawColor, includeAlpha = true): string {
    return rgbaToHex(rawColorToRgba(raw), includeAlpha);
}

export function hexToRawColor(hex: string): RawColor | null {
    const rgba = hexToRgba(hex);
    if (!rgba) return null;
    return rgbaToRawColor(rgba);
}

export function rgbaToCssString(rgba: RGBA): string {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
}

export function rawColorToCssString(raw: RawColor): string {
    return `rgba(${raw[0] * 255}, ${raw[1] * 255}, ${raw[2] * 255}, ${raw[3]})`;
}

export function multiplyColors(color1: RawColor, color2: RawColor): RawColor {
    return [color1[0] * color2[0], color1[1] * color2[1], color1[2] * color2[2], color1[3] * color2[3]];
}

export function rawColorToThreeColor(raw: RawColor): THREE.Color {
    return new THREE.Color(raw[0], raw[1], raw[2]);
}