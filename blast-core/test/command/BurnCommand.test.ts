import { 
    describe, 
    it, 
    expect, 
    xit,
} from '@jest/globals';
import { DefaultTileField } from '../../src/TileField';
import { DefaultGame } from '../../src/DefaultGame';
import { TileFactory } from '../../src/TileFactory';
import { UtilityConfig } from '../../src/UtilityConfig';
import { BurnCommand } from '../../src/command/BurnCommand';
import { 
    createMockInstance,
    DEFAULT_CONFIG, 
    empty, 
    getGameTiles, 
} from '../testUtils';
import { DefaultCommandFactory } from '../../src/command/DefaultCommandFactory';

describe('BurnCommand', () => {
    it('Burn around', () => {
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
        });
        const game = new DefaultGame(
            utilConfig.config,
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            field,
        );
        const cmd = new BurnCommand(
            game, 
            [
                [{x: -1, y: -1}, {x: 1, y: 1}]
            ], 
            { x: 2, y: 1 }
        );
        const cmdResult = cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   ,  empty  ,  empty,  empty,
            'blue'  ,  empty  ,  empty,  empty,
            'green' ,  empty  ,  empty,  empty,
            'purple', 'purple', 'blue', 'blue',
        ]);
        expect(cmdResult.scoreDiff).toBe(8);
        expect(cmdResult.type).toBe('burns');
        if (cmdResult.type === 'burns') {
            expect(cmdResult.burns).toEqual(expect.arrayContaining([
                { x: 1, y: 0, tile: 'red' },
                { x: 2, y: 0, tile: 'red' },
                { x: 3, y: 0, tile: 'purple' },
                { x: 1, y: 1, tile: 'yellow' },
                { x: 2, y: 1, tile: 'burn_around' },
                { x: 3, y: 1, tile: 'yellow' },
                { x: 1, y: 2, tile: 'green' },
                { x: 2, y: 2, tile: 'green' },
                { x: 3, y: 2, tile: 'green' },
            ]));
        }
    });

    it('Burn around undo', () => {
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
        });
        const game = new DefaultGame(
            utilConfig.config,
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            field,
        );
        const cmd = new BurnCommand(
            game, 
            [
                [{x: -1, y: -1}, {x: 1, y: 1}]
            ], 
            { x: 2, y: 1 }
        );
        cmd.do(game);
        const cmdResult = cmd.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'    , 'red'        , 'purple',
            'blue'  , 'yellow' , 'burn_around', 'yellow',
            'green' , 'green'  , 'green'      , 'green' ,
            'purple', 'purple' , 'blue'       , 'blue'  ,
        ]);
        expect(cmdResult.scoreDiff).toBe(-8);
        expect(cmdResult.type).toBe('appears');
        if (cmdResult.type === 'appears') {
            expect(cmdResult.appears).toEqual(expect.arrayContaining([
                { x: 1, y: 0, tile: 'red' },
                { x: 2, y: 0, tile: 'red' },
                { x: 3, y: 0, tile: 'purple' },
                { x: 1, y: 1, tile: 'yellow' },
                { x: 2, y: 1, tile: 'burn_around' },
                { x: 3, y: 1, tile: 'yellow' },
                { x: 1, y: 2, tile: 'green' },
                { x: 2, y: 2, tile: 'green' },
                { x: 3, y: 2, tile: 'green' },
            ]));
        }
    });

    it('Burn column', () => {
        const field = new DefaultTileField(4, 4, [
            'red'   , 'red'    , 'red'        , 'purple',
            'blue'  , 'yellow' , 'burn_column', 'yellow',
            'green' , 'green'  , 'green'      , 'green' ,
            'purple', 'purple' , 'blue'       , 'blue'  ,
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
        });
        const game = new DefaultGame(
            utilConfig.config,
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            field,
        );
        const cmd = new BurnCommand(
            game, 
            [
                [{x: 0, y: 'e'}, {x: 0, y: 'e'}]
            ], 
            { x: 2, y: 1 }
        );
        const cmdResult = cmd.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'   , empty, 'purple',
            'blue'  , 'yellow', empty, 'yellow',
            'green' , 'green' , empty, 'green' ,
            'purple', 'purple', empty, 'blue'  ,
        ]);
        expect(cmdResult.scoreDiff).toBe(3);
        expect(cmdResult.type).toBe('burns');
        if (cmdResult.type === 'burns') {
            expect(cmdResult.burns).toEqual(expect.arrayContaining([
                { x: 2, y: 0, tile: 'red' },
                { x: 2, y: 1, tile: 'burn_column' },
                { x: 2, y: 2, tile: 'green' },
                { x: 2, y: 3, tile: 'blue' },
            ]));
        }
    });

    it('Burn around + column', () => {
        const field = new DefaultTileField(4, 4, [
            'red'   , 'red'         , 'red'        , 'purple',
            'blue'  , 'burn_column' , 'burn_around', 'yellow',
            'green' , 'green'       , 'green'      , 'green' ,
            'purple', 'purple'      , 'blue'       , 'blue'  ,
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
        });
        const game = new DefaultGame(
            utilConfig.config,
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            field,
        );
        const cmd1 = new BurnCommand(
            game, 
            [
                [{x: -1, y: -1}, {x: 1, y: 1}]
            ], 
            { x: 2, y: 1 }
        );
        const cmd2 = new BurnCommand(
            game, 
            [
                [{x: 0, y: 'e'}, {x: 0, y: 'e'}]
            ], 
            { x: 1, y: 1 }
        );
        cmd1.do(game);
        const cmdResult2 = cmd2.do(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , empty,  empty,  empty,
            'blue'  , empty,  empty,  empty,
            'green' , empty,  empty,  empty,
            'purple', empty, 'blue', 'blue',
        ]);
        expect(cmdResult2.scoreDiff).toBe(1);
        expect(cmdResult2.type).toBe('burns');
        if (cmdResult2.type === 'burns') {
            expect(cmdResult2.burns).toEqual(expect.arrayContaining([
                { x: 1, y: 3, tile: 'purple' },
            ]));
        }
    });

    it('Burn around + column undo undo', () => {
        const field = new DefaultTileField(4, 4, [
            'red'   , 'red'         , 'red'        , 'purple',
            'blue'  , 'burn_column' , 'burn_around', 'yellow',
            'green' , 'green'       , 'green'      , 'green' ,
            'purple', 'purple'      , 'blue'       , 'blue'  ,
        ]);
        const utilConfig = new UtilityConfig({
            ...DEFAULT_CONFIG,
            width: field.width,
            height: field.height,
        });
        const game = new DefaultGame(
            utilConfig.config,
            createMockInstance(TileFactory),
            createMockInstance(DefaultCommandFactory),
            field,
        );
        const cmd1 = new BurnCommand(
            game, 
            [
                [{x: -1, y: -1}, {x: 1, y: 1}]
            ], 
            { x: 2, y: 1 }
        );
        const cmd2 = new BurnCommand(
            game, 
            [
                [{x: 0, y: 'e'}, {x: 0, y: 'e'}]
            ], 
            { x: 1, y: 1 }
        );
        const cmdResult1 = cmd1.do(game);
        expect(cmdResult1.scoreDiff).toBe(7);
        const cmdResult2 = cmd2.do(game);
        expect(cmdResult2.scoreDiff).toBe(1);
        const cmdResultUndo2 = cmd2.undo(game);
        expect(cmdResultUndo2.scoreDiff).toBe(-1);
        const cmdUndoResult1 = cmd1.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
            'red'   , 'red'         , 'red'        , 'purple',
            'blue'  , 'burn_column' , 'burn_around', 'yellow',
            'green' , 'green'       , 'green'      , 'green' ,
            'purple', 'purple'      , 'blue'       , 'blue'  ,
        ]);
        expect(cmdUndoResult1.scoreDiff).toBe(-7);
        expect(cmdUndoResult1.type).toBe('appears');
        if (cmdUndoResult1.type === 'appears') {
            expect(cmdUndoResult1.appears).toEqual(expect.arrayContaining([
                { x: 1, y: 0, tile: 'red' },
                { x: 2, y: 0, tile: 'red' },
                { x: 3, y: 0, tile: 'purple' },
                { x: 1, y: 1, tile: 'burn_column' },
                { x: 2, y: 1, tile: 'burn_around' },
                { x: 3, y: 1, tile: 'yellow' },
                { x: 1, y: 2, tile: 'green' },
                { x: 2, y: 2, tile: 'green' },
                { x: 3, y: 2, tile: 'green' },
            ]));
        }
    });
});