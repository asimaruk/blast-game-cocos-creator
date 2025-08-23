export const TILE_COLORS = [
    'red',
    'green',
    'blue',
    'purple',
    'yellow',
] as const;
export type TileColor = typeof TILE_COLORS[number];

export const TILE_SUPERS = [
    'burn_raw',
    'burn_column',
    'burn_around',
    'burn_all',
] as const;
export type TileSuper = typeof TILE_SUPERS[number];

export type TileKind = TileColor | TileSuper | 'empty';

export type Position = {
    x: number,
    y: number,
};

export type TilePosition = { tile: TileKind } & Position;
export type NotEmptyTilePosition = { tile: Exclude<TileKind, 'empty'> } & Position;

export function isColorTile(kind: unknown): kind is TileColor {
    return TILE_COLORS.findIndex((t) => t === kind) >= 0;
}

export function isSuperTile(kind: unknown): kind is TileSuper {
    return TILE_SUPERS.findIndex((t) => t === kind) >= 0;
}