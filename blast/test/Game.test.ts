import { 
    describe, 
    it, 
    expect, 
    xit,
} from '@jest/globals';
import { 
    Game, 
    isColorTile as color, 
    isSuperTile as supar,
    TileKind, 
} from '../src';
import { DefaultTileField } from '../src/TileField';

type SyncExpectationResult = { pass: boolean, message: () => string };
type ExpectationResult =
  | SyncExpectationResult
  | Promise<SyncExpectationResult>;

declare module 'expect' {
    interface Matchers<R> {
        toEqualWithTileRules(expected: (TileKind | ((t: TileKind) => boolean))[]): R;
    }
}

expect.extend({
    toEqualWithTileRules(
        received: TileKind[], 
        expected: TileKind | ((t: TileKind) => boolean)[]
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

function getGameTiles(game: Game): TileKind[] {
    const tiles: TileKind[] = [];
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

describe('Game', () => {
    it('Burn decrements moves left', () => {
        const field = new DefaultTileField(2, 2, [
            'red'  , 'red'   ,
            'blue' , 'red'   ,
        ]);
        const game = new Game(
            {
                width: 4,
                height: 4,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
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
        const game = new Game(
            {
                width: 4,
                height: 4,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(0, 1);
        expect(game.getMovesLeft()).toBe(10);
    });

    it('No moves no pick', () => {
        const field = new DefaultTileField(2, 2, [
            'red'  , 'red',
            'blue' , 'red',
        ]);
        const game = new Game(
            {
                width: 4,
                height: 4,
                moves: 0,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(0, 0);
        expect(game.getMovesLeft()).toBe(0);
        expect(getGameTiles(game)).toEqual([
            'red'  , 'red',
            'blue' , 'red',
        ]);
    });

    it('Pick horizontal rockets', () => {
        const field = new DefaultTileField(3, 3, [
            'red'  , 'red'   , 'red',
            'blue' , 'yellow', 'burn_raw',
            'green', 'green' , 'green'
        ]);
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 1);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 1);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 1);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 1);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 3);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 6);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(2, 4);
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
            'purple', 'purple' , 'blue'  , 'green' , 'burn_raw', 'burn_column', 'red', 'purple', 
            'purple', 'purple' , 'blue'  , 'blue'  , 'red'     , 'red'        , 'red', 'purple', 
            'purple', 'purple' , 'yellow', 'yellow', 'red'     , 'red'        , 'red', 'purple', 
        ]);
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
            field,
        );
        game.pick(4, 5);
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
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
        const game = new Game(
            {
                width: field.width,
                height: field.height,
                moves: 10,
                winScore: 999,
                countToSuper: 6,
            },
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
        const config = {
            width: field.width,
            height: field.height,
            moves: 10,
            winScore: 999,
            countToSuper: 3,
        };
        const game = new Game(
            config,
            field,
        );
        while(game.isGameOver()) {
            game.restart();
        }
        for (let x = 0; x < config.width; x++) {
            for (let y = 0; y < config.height; y++) {
                game.pick(x, y);
            }
        }
        const tiles = getGameTiles(game);
        expect(tiles).not.toContain('empty');
        expect(tiles).not.toContain(undefined);
        expect(tiles).not.toContain(null);
        expect(tiles).toHaveLength(config.width * config.height);
    });
});