export type TileKind = string;
export const EMPTY_TILE = 'empty';

export function isTileKind(obj: unknown): obj is TileKind {
    return typeof obj === 'string'
        && obj !== EMPTY_TILE;
}

export function isTileEmpty(obj: unknown): obj is typeof EMPTY_TILE {
    return obj === EMPTY_TILE;
}
