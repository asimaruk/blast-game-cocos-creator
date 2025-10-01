import { Game } from "../src";

export const DEFAULT_CONFIG: Game.Config = {
    width: 10,
    height: 10,
    moves: 30,
    winScore: 500,
    countToSuper: 6,
    colors: ['red', 'green', 'blue', 'purple', 'yellow'],
    superActions: {}
};

export const empty = (tile: Game.TileKind) => tile === Game.EMPTY_TILE;

export function getGameTiles(game: Game): Game.TileKind[] {
    const tiles: Game.TileKind[] = [];
    const config = game.getConfig().config;
    for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
            const tile = game.getTile(x, y);
            if (tile) {
                tiles.push(tile);
            }
        }
    }
    return tiles;
}

export function createMockInstance<T>(
    constructor: new (...args: any[]) => T,
    overrides: Partial<T> = {},
): jest.Mocked<T> {
    const mock = {} as jest.Mocked<T>;
    const prototype = constructor.prototype;
    Object.getOwnPropertyNames(prototype).forEach(prop => {
        if (prop !== 'constructor' && typeof prototype[prop] === 'function') {
            mock[prop as keyof T] = jest.fn() as any;
        }
    });
    return { ...mock, ...overrides };
}