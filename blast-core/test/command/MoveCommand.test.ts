import { 
    describe, 
    it, 
    expect, 
    xit,
} from '@jest/globals';
import { MoveCommand } from '../../src/command/MoveCommand';
import { DefaultGame } from '../../src/DefaultGame';
import { 
    createMockInstance, 
    DEFAULT_CONFIG, 
    getGameTiles, 
} from '../testUtils';
import { TileFactory } from '../../src/TileFactory';
import { DefaultTileField } from '../../src/TileField';
import { Game } from '../../src';
import { DefaultCommandFactory } from '../../src/command/DefaultCommandFactory';

describe('MoveCommand', () => {
    const empty = Game.EMPTY_TILE;

    it("Fall square", () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   ,  empty  ,  empty,  empty,
                'blue'  ,  empty  ,  empty,  empty,
                'green' ,  empty  ,  empty,  empty,
                'purple', 'purple', 'blue', 'blue',
            ]),
        );
        const cmd = MoveCommand.createFalls(game);
        const cmdResult = cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'purple', 'blue', 'blue',
            'blue'  ,  empty  ,  empty,  empty,
            'green' ,  empty  ,  empty,  empty,
            'purple',  empty  ,  empty,  empty,
        ]);
        expect(cmdResult.type).toBe('moves');
        expect(cmdResult.scoreDiff).toBeUndefined();
        if (cmdResult.type === 'moves') {
            expect(cmdResult.moves).toEqual(expect.arrayContaining([
                [{x: 1, y: 3}, {x: 1, y: 0}],
                [{x: 2, y: 3}, {x: 2, y: 0}],
                [{x: 3, y: 3}, {x: 3, y: 0}],
            ]));
        }
    });

    it("Fall twist", () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = MoveCommand.createFalls(game);
        const cmdResult = cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'blue'  , 'purple', 'red'  , 'purple',
            'purple',  empty  , 'green', 'yellow',
             empty  ,  empty  , 'green', 'red',
             empty  ,  empty  , 'blue' , 'blue',
        ]);
        expect(cmdResult.type).toBe('moves');
        expect(cmdResult.scoreDiff).toBeUndefined();
        if (cmdResult.type === 'moves') {
            expect(cmdResult.moves).toEqual(expect.arrayContaining([
                [{x: 0, y: 1}, {x: 0, y: 0}],
                [{x: 0, y: 3}, {x: 0, y: 1}],
                [{x: 1, y: 3}, {x: 1, y: 0}],
            ]));
        }
    });

    it("Fall double twist", () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 6,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 6, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple',  empty  , 'blue' , 'blue',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = MoveCommand.createFalls(game);
        const cmdResult = cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'blue'  , 'purple', 'red'  , 'purple',
            'purple',  empty  , 'green', 'yellow',
            'purple',  empty  , 'green', 'red',
             empty  ,  empty  , 'blue' , 'blue',
             empty  ,  empty  , 'green', 'red',
             empty  ,  empty  , 'blue' , 'blue',
        ]);
        expect(cmdResult.type).toBe('moves');
        expect(cmdResult.scoreDiff).toBeUndefined();
        if (cmdResult.type === 'moves') {
            expect(cmdResult.moves).toEqual(expect.arrayContaining([
                [{x: 0, y: 1}, {x: 0, y: 0}],
                [{x: 0, y: 3}, {x: 0, y: 1}],
                [{x: 0, y: 5}, {x: 0, y: 2}],
                [{x: 1, y: 5}, {x: 1, y: 0}],
            ]));
        }
    });

    it("Fall double twist undo", () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 6,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 6, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple',  empty  , 'blue' , 'blue',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = MoveCommand.createFalls(game);
        cmd.do(game);
        const undoResult = cmd.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
             empty  ,  empty  , 'red'  , 'purple',
            'blue'  ,  empty  , 'green', 'yellow',
             empty  ,  empty  , 'green', 'red',
            'purple',  empty  , 'blue' , 'blue',
             empty  ,  empty  , 'green', 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(undoResult.type).toBe('moves');
        expect(undoResult.scoreDiff).toBeUndefined();
        if (undoResult.type === 'moves') {
            expect(undoResult.moves).toEqual(expect.arrayContaining([
                [{x: 0, y: 0}, {x: 0, y: 1}],
                [{x: 0, y: 1}, {x: 0, y: 3}],
                [{x: 0, y: 2}, {x: 0, y: 5}],
                [{x: 1, y: 0}, {x: 1, y: 5}],
            ]));
        }
    });

    it("Double fall", () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   ,  empty  ,  empty,  empty,
                'blue'  ,  empty  ,  empty,  empty,
                'green' ,  empty  ,  empty,  empty,
                'purple', 'purple', 'blue', 'blue',
            ]),
        );
        const cmd1 = MoveCommand.createFalls(game);
        const cmd2 = MoveCommand.createFalls(game);
        cmd1.do(game);
        const cmdResult2 = cmd2.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'purple', 'blue', 'blue',
            'blue'  ,  empty  ,  empty,  empty,
            'green' ,  empty  ,  empty,  empty,
            'purple',  empty  ,  empty,  empty,
        ]);
        expect(cmdResult2.type).toBe('moves');
        if (cmdResult2.type === 'moves') {
            expect(cmdResult2.moves).toHaveLength(0);
        }
    });

    it("Double fall undo latest", () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   ,  empty  ,  empty,  empty,
                'blue'  ,  empty  ,  empty,  empty,
                'green' ,  empty  ,  empty,  empty,
                'purple', 'purple', 'blue', 'blue',
            ]),
        );
        const cmd1 = MoveCommand.createFalls(game);
        const cmd2 = MoveCommand.createFalls(game);
        cmd1.do(game);
        cmd2.do(game);
        const undoResult2 = cmd2.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'purple', 'blue', 'blue',
            'blue'  ,  empty  ,  empty,  empty,
            'green' ,  empty  ,  empty,  empty,
            'purple',  empty  ,  empty,  empty,
        ]);
        expect(undoResult2.type).toBe('moves');
        if (undoResult2.type === 'moves') {
            expect(undoResult2.moves).toHaveLength(0);
        }
    });

    it('Single move', () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   , 'red'    , 'red'  , 'purple',
                'blue'  , 'yellow' , 'blue' , 'yellow',
                'green' , 'green'  , 'green', 'green' ,
                'purple', 'purple' , 'blue' , 'blue'  ,
            ]),
        );
        const cmd = new MoveCommand([
            [{x: 1, y: 1}, {x: 1, y: 2}],
        ]);
        cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'   , 'red'  , 'purple',
            'blue'  ,  empty  , 'blue' , 'yellow',
            'green' , 'yellow', 'green', 'green' ,
            'purple', 'purple', 'blue' , 'blue'  ,
        ]);
    });

    it('Pair swap', () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   , 'red'    , 'red'  , 'purple',
                'blue'  , 'yellow' , 'blue' , 'yellow',
                'green' , 'green'  , 'green', 'green' ,
                'purple', 'purple' , 'blue' , 'blue'  ,
            ]),
        );
        const cmd = new MoveCommand([
            [{x: 1, y: 1}, {x: 1, y: 2}],
            [{x: 1, y: 2}, {x: 1, y: 1}],
        ]);
        cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'   , 'red'  , 'purple',
            'blue'  , 'green' , 'blue' , 'yellow',
            'green' , 'yellow', 'green', 'green' ,
            'purple', 'purple', 'blue' , 'blue'  ,
        ]);
    });
});