import { 
    describe, 
    it, 
    expect, 
    xit,
} from '@jest/globals';
import { Game } from '../src';
import { DefaultTileField } from '../src/TileField';
import { TileFactory } from '../src/TileFactory';
import { UtilityConfig } from '../src/UtilityConfig';
import { DefaultGame } from '../src/DefaultGame';

type SyncExpectationResult = { pass: boolean, message: () => string };
type ExpectationResult =
  | SyncExpectationResult
  | Promise<SyncExpectationResult>;

declare module 'expect' {
    interface Matchers<R> {
        toEqualWithTileRules(expected: (Game.TileKind | ((t: Game.TileKind) => boolean))[]): R;
    }
}

expect.extend({
    toEqualWithTileRules(
        received: Game.TileKind[], 
        expected: Game.TileKind | ((t: Game.TileKind) => boolean)[]
    ): ExpectationResult {
        if (received.length !== expected.length) {
            return {
                pass: false,
                message: () => `Arrays have different lengths. Expected ${expected.length}, got ${received.length}`
            };
        }
        for (let i = 0; i < expected.length; i++) {
            const exp = expected[i];
            const rec = received[i];
            if ((typeof exp === 'function')) {
                if (rec && !exp(rec)) {
                    return {
                        pass: false,
                        message: () => `At index ${i}, expected rule didn't match for ${rec}`
                    };
                }
            } else if (rec !== exp) {
                return {
                    pass: false,
                    message: () => `At index ${i}, expected ${exp}, got ${rec}`
                };
            }
        }
        return {
            pass: true,
            message: () => `Arrays match ignoring 'skip' values`,
        };
    }
});

function getGameTiles(game: Game): Game.TileKind[] {
    const tiles: Game.TileKind[] = [];
    for (let y = 0; y < game.getHeight(); y++) {
        for (let x = 0; x < game.getWidth(); x++) {
            const tile = game.getTile(x, y);
            if (tile) {
                tiles.push(tile);
            }
        }
    } 
    return tiles;
}

const DEFAULT_CONFIG: Game.Config = {
    width: 10,
    height: 10,
    moves: 30,
    winScore: 500,
    countToSuper: 6,
    colors: ['red', 'green', 'blue', 'purple', 'yellow'],
    superActions: {
        burn_row: [
            { 
                id: 'burn', 
                burns: [
                    [{x: 'e', y: 0}, {x: 'e', y: 0}]
                ]
            }
        ],
        burn_column: [
            { 
                id: 'burn', 
                burns: [
                    [{x: 0, y: 'e'}, {x: 0, y: 'e'}]
                ]
            }
        ],
        burn_around: [
            { 
                id: 'burn', 
                burns: [
                    [{x: -1, y: -1}, {x: 1, y: 1}]
                ]
            }
        ],
        burn_all: [
            { 
                id: 'burn', 
                burns: [
                    [{x: 'e', y: 'e'}, {x: 'e', y: 'e'}]
                ]
            }
        ]
    }
}

describe('Game', () => {
    it('Burn decrements moves left', () => {
        const field = new DefaultTileField(2, 2, [
            'red'  , 'red'   ,
            'blue' , 'red'   ,
        ]);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
                moves: 10,
                winScore: 999,
            },
            new TileFactory(DEFAULT_CONFIG.colors, Object.keys(DEFAULT_CONFIG.superActions)),
            field,
        );
        game.pick(0, 0);
        expect(game.getMovesLeft()).toBe(9);
    });

    it('Idle move does not decrement', () => {
        const field = new DefaultTileField(2, 2, [
            'red'  , 'red'   ,
            'blue' , 'red'   ,
        ]);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            new TileFactory(DEFAULT_CONFIG.colors, Object.keys(DEFAULT_CONFIG.superActions)),
            field,
        );
        game.pick(0, 1);
        expect(game.getMovesLeft()).toBe(10);
    });

    it('No moves no pick', () => {
        const field = new DefaultTileField(3, 3, [
            'green', 'red'   , 'blue',
            'blue' , 'yellow', 'blue',
            'blue' , 'purple', 'blue',
        ]);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
                moves: 1,
                winScore: 999,
                countToSuper: 6,
            },
            new TileFactory(DEFAULT_CONFIG.colors, Object.keys(DEFAULT_CONFIG.superActions)),
            field,
        );
        game.pick(2, 0);
        game.pick(0, 1);
        expect(game.getMovesLeft()).toBe(0);
        expect(game.getScore()).toBe(3);
    });

    it('Pick horizontal rockets', () => {
        const field = new DefaultTileField(3, 3, [
            'red'  , 'red'   , 'red',
            'blue' , 'yellow', 'burn_row',
            'green', 'green' , 'green'
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(DEFAULT_CONFIG.colors, Object.keys(DEFAULT_CONFIG.superActions)),
            field,
        );
        game.pick(2, 1);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'  , 'red'  , 'red'  ,
            'green', 'green', 'green',
             color ,  color ,  color ,
        ]);
    });

    it('Pick vertical rockets', () => {
        const field = new DefaultTileField(3, 3, [
            'red'  , 'red'   , 'red',
            'blue' , 'yellow', 'burn_column',
            'green', 'green' , 'green'
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(2, 1);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'  , 'red'   , color,
            'blue' , 'yellow', color,
            'green', 'green' , color,
        ]);
    });

    it('Pick burn around', () => {
        const field = new DefaultTileField(4, 4, [
            'red'   , 'red'    , 'red'        , 'purple',
            'blue'  , 'yellow' , 'burn_around', 'yellow',
            'green' , 'green'  , 'green'      , 'green' ,
            'purple', 'purple' , 'blue'       , 'blue'  ,
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(2, 1);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'purple', 'blue', 'blue',
            'blue'  ,  color  ,  color,  color,
            'green' ,  color  ,  color,  color,
            'purple',  color  ,  color,  color,
        ]);
    });

    it('Pick burn all', () => {
        const field = new DefaultTileField(4, 4, [
            'red'   , 'red'    , 'red'     , 'purple',
            'blue'  , 'yellow' , 'burn_all', 'yellow',
            'green' , 'green'  , 'green'   , 'green' ,
            'purple', 'purple' , 'blue'    , 'blue'  ,
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(2, 1);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules(Array(field.width * field.height).fill(color));
    });

    it('Stack super and fall', () => {
        const field = new DefaultTileField(8, 8, [
            'red'   , 'red'    , 'red'   , 'purple', 'red', 'red', 'red', 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red', 'red', 'red', 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'yellow', 'red', 'red', 'red', 'purple', 
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(2, 3);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        const supar = (t: Game.TileKind) => utilConfig.isSuperTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'    , 'red'   , 'purple', 'red', 'red', 'red', 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red', 'red', 'red', 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  supar  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  color  , 'yellow', 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  color  ,  color  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  color  ,  color  , 'red', 'red', 'red', 'purple', 
        ]);
    });

    it('Stack super and fall high', () => {
        const field = new DefaultTileField(8, 8, [
            'red'   , 'red'    , 'red'   , 'purple', 'red', 'red', 'red', 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red', 'red', 'red', 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'yellow', 'red', 'red', 'red', 'purple', 
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(2, 6);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        const supar = (t: Game.TileKind) => utilConfig.isSuperTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'    , 'red'   , 'purple', 'red', 'red', 'red', 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red', 'red', 'red', 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  supar  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  color  , 'yellow', 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  color  ,  color  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' ,  color  ,  color  , 'red', 'red', 'red', 'purple', 
        ]);
    });

    it('Stack super in middle of a column', () => {
        const field = new DefaultTileField(8, 8, [
            'red'   , 'red'    , 'red'   , 'purple', 'red', 'red', 'red', 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red', 'red', 'red', 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red', 'red', 'red', 'purple', 
            'purple', 'blue'   , 'blue'  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red', 'red', 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'yellow', 'red', 'red', 'red', 'purple', 
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(2, 4);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        const supar = (t: Game.TileKind) => utilConfig.isSuperTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'   , 'red'   , 'purple', 'red', 'red', 'red', 'purple', 
            'blue'  , 'yellow', 'blue'  , 'yellow', 'red', 'red', 'red', 'purple', 
            'green' , 'green' , 'green' , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple',  supar  , 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple', 'yellow', 'green' , 'red', 'red', 'red', 'purple', 
            'purple', 'purple',  color  , 'yellow', 'red', 'red', 'red', 'purple', 
            'purple', 'purple',  color  ,  color  , 'red', 'red', 'red', 'purple', 
            'purple',  color  ,  color  ,  color  , 'red', 'red', 'red', 'purple', 
        ]);
    });

    it('Pick rocket triger other rocket', () => {
        const field = new DefaultTileField(8, 8, [
            'red'   , 'red'    , 'red'   , 'purple', 'red'     , 'red'        , 'red', 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red'     , 'red'        , 'red', 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red'     , 'red'        , 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red'     , 'red'        , 'red', 'purple', 
            'purple', 'blue'   , 'blue'  , 'green' , 'red'     , 'red'        , 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'green' , 'burn_row', 'burn_column', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red'     , 'red'        , 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'yellow', 'red'     , 'red'        , 'red', 'purple', 
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.pick(4, 5);
        const color = (t: Game.TileKind) => utilConfig.isColorTile(t);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'    , 'red'   , 'purple', 'red' , color, 'red' , 'purple', 
            'blue'  , 'yellow' , 'blue'  , 'yellow', 'red' , color, 'red' , 'purple', 
            'green' , 'green'  , 'green' , 'green' , 'red' , color, 'red' , 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red' , color, 'red' , 'purple', 
            'purple', 'blue'   , 'blue'  , 'green' , 'red' , color, 'red' , 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red' , color, 'red' , 'purple', 
            'purple', 'purple' , 'yellow', 'yellow', 'red' , color, 'red' , 'purple', 
             color  ,  color   ,  color  ,  color  ,  color, color,  color,  color  , 
        ]);
        expect(game.getScore()).toBe(13);
    });

    it('Restart', () => {
        const field = new DefaultTileField(3, 3, [
            'red'  , 'red'   , 'red',
            'blue' , 'yellow', 'blue',
            'green', 'green' , 'green'
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        game.restart();
        const tiles = getGameTiles(game);
        expect(tiles).toHaveLength(9);
        expect(tiles).not.toContain('empty');
    });

    it('Game over no moves', () => {
        const field = new DefaultTileField(3, 3, [
            'red'  , 'green' , 'red',
            'blue' , 'yellow', 'blue',
            'green', 'blue'  , 'green'
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 6,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        expect(game.isGameOver()).toBeTruthy();
    });

    it('Restart and pick', () => {
        const field = new DefaultTileField(3, 3, [
            'red'  , 'green' , 'red',
            'blue' , 'yellow', 'blue',
            'green', 'blue'  , 'green'
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 3,
        });
        const game = new DefaultGame(
            utilConfig.config,
            new TileFactory(utilConfig.config.colors, Object.keys(utilConfig.config.superActions)),
            field,
        );
        while(game.isGameOver()) {
            game.restart();
        }
        for (let x = 0; x < utilConfig.config.width; x++) {
            for (let y = 0; y < utilConfig.config.height; y++) {
                game.pick(x, y);
            }
        }
        const tiles = getGameTiles(game);
        expect(tiles).not.toContain('empty');
        expect(tiles).not.toContain(undefined);
        expect(tiles).not.toContain(null);
        expect(tiles).toHaveLength(utilConfig.config.width * utilConfig.config.height);
    });
});