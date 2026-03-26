export const blendModeValues = ["Over", "Add", "Multiply"] as const;
export type BlendMode = typeof blendModeValues[number];

export type Position = [number, number]
export type Scale = [number, number]
export type Size = [number, number]

export type SurfaceFlip = [boolean, boolean]

export const SCREEN_X_MIN = -999.99;
export const SCREEN_X_MAX = 999.99;
export const SCREEN_Y_MIN = -999.99;
export const SCREEN_Y_MAX = 999.99;