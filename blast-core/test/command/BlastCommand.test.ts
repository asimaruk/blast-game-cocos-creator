import { 
    describe, 
    it, 
    expect, 
    xit,
} from '@jest/globals';
import { 
    createMockInstance, 
    DEFAULT_CONFIG, 
    empty, 
    getGameTiles, 
} from '../testUtils';
import { TileFactory } from '../../src/TileFactory';
import { DefaultGame } from '../../src/DefaultGame';
import { DefaultTileField } from '../../src/TileField';
import { BlastCommand } from '../../src/command/BlastCommand';
import { DefaultCommandFactory } from '../../src/command/DefaultCommandFactory';

describe('BlastCommand', () => {
    it('Single blast', () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   , 'red'   , 'red'  , 'purple',
                'blue'  , 'green' , 'green', 'yellow',
                'purple', 'green' , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = new BlastCommand(game.getTileField(), { x: 0, y: 0 });
        const cmdResult = cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
             empty  ,  empty  ,  empty , 'purple',
            'blue'  , 'green' , 'green', 'yellow',
            'purple', 'green' , 'green', 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(cmdResult.type).toBe('blasts');
        expect(cmdResult.scoreDiff).toBe(3);
        if (cmdResult.type === 'blasts') {
            expect(cmdResult.blasts).toEqual(expect.arrayContaining([
                { x: 0, y: 0, tile: 'red' },
                { x: 1, y: 0, tile: 'red' },
                { x: 2, y: 0, tile: 'red' },
            ]));
        }
    });

    it('Single blast undo', () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   , 'red'   , 'red'  , 'purple',
                'blue'  , 'green' , 'green', 'yellow',
                'purple', 'green' , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = new BlastCommand(game.getTileField(), { x: 0, y: 0 });
        cmd.do(game);
        const undoResult = cmd.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'   , 'red'  , 'purple',
            'blue'  , 'green' , 'green', 'yellow',
            'purple', 'green' , 'green', 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(undoResult.type).toBe('appears');
        expect(undoResult.scoreDiff).toBe(-3);
        if (undoResult.type === 'appears') {
            expect(undoResult.appears).toEqual(expect.arrayContaining([
                { x: 0, y: 0, tile: 'red' },
                { x: 1, y: 0, tile: 'red' },
                { x: 2, y: 0, tile: 'red' },
            ]));
        }
    });

    it('Double blast', () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   , 'red'   , 'red'  , 'purple',
                'blue'  , 'green' , 'green', 'yellow',
                'purple', 'green' , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd1 = new BlastCommand(game.getTileField(), { x: 0, y: 0 });
        const cmd2 = new BlastCommand(game.getTileField(), { x: 1, y: 1 });
        cmd1.do(game);
        const cmdResult2 = cmd2.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
             empty  ,  empty  ,  empty , 'purple',
            'blue'  ,  empty  ,  empty , 'yellow',
            'purple',  empty  ,  empty , 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(cmdResult2.type).toBe('blasts');
        expect(cmdResult2.scoreDiff).toBe(4);
        if (cmdResult2.type === 'blasts') {
            expect(cmdResult2.blasts).toEqual(expect.arrayContaining([
                { x: 1, y: 1, tile: 'green' },
                { x: 1, y: 2, tile: 'green' },
                { x: 2, y: 1, tile: 'green' },
                { x: 2, y: 2, tile: 'green' },
            ]));
        }
    });

    it('Double blast undo latest', () => {
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                'red'   , 'red'   , 'red'  , 'purple',
                'blue'  , 'green' , 'green', 'yellow',
                'purple', 'green' , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd1 = new BlastCommand(game.getTileField(), { x: 0, y: 0 });
        const cmd2 = new BlastCommand(game.getTileField(), { x: 1, y: 1 });
        cmd1.do(game);
        cmd2.do(game);
        const undoResult2 = cmd2.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
             empty  ,  empty  ,  empty , 'purple',
            'blue'  , 'green' , 'green', 'yellow',
            'purple', 'green' , 'green', 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(undoResult2.type).toBe('appears');
        expect(undoResult2.scoreDiff).toBe(-4);
        if (undoResult2.type === 'appears') {
            expect(undoResult2.appears).toEqual(expect.arrayContaining([
                { x: 1, y: 1, tile: 'green' },
                { x: 1, y: 2, tile: 'green' },
                { x: 2, y: 1, tile: 'green' },
                { x: 2, y: 2, tile: 'green' },
            ]));
        }
    });
});