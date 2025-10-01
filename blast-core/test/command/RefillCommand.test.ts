import { 
    describe, 
    it, 
    expect, 
    xit,
} from '@jest/globals';
import { DefaultGame } from '../../src/DefaultGame';
import { 
    createMockInstance, 
    DEFAULT_CONFIG, 
    getGameTiles, 
} from '../testUtils';
import { TileFactory } from '../../src/TileFactory';
import { DefaultTileField } from '../../src/TileField';
import { Game } from '../../src/Game';
import { RefillCommand } from '../../src/command/RefillCommand';
import { DefaultCommandFactory } from '../../src/command/DefaultCommandFactory';

describe('RefillCommand', () => {
    const empty = Game.EMPTY_TILE;

    it('appear tiles', () => {
        const tileFactory = new TileFactory(DEFAULT_CONFIG.colors, []);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            tileFactory,
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = new RefillCommand(game, tileFactory);
        const cmdResult = cmd.do(game);
        const color = (tile: Game.TileKind) => game.getConfig().isColorTile(tile);
        expect(getGameTiles(game)).toEqualWithTileRules([
             color  ,  color  , 'red'  , 'purple',
            'blue'  ,  color  , 'green', 'yellow',
             color  ,  color  , 'green', 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(cmdResult.type).toBe('refills');
        if (cmdResult.type === 'refills') {
            expect(cmdResult.refills).toHaveLength(5);
        }
    });

    it('appear tiles undo', () => {
        const tileFactory = new TileFactory(DEFAULT_CONFIG.colors, []);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            tileFactory,
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd = new RefillCommand(game, tileFactory);
        cmd.do(game);
        const undoResult = cmd.undo(game);
        expect(getGameTiles(game)).toEqualWithTileRules([
             empty  ,  empty  , 'red'  , 'purple',
            'blue'  ,  empty  , 'green', 'yellow',
             empty  ,  empty  , 'green', 'red',
            'purple', 'purple', 'blue' , 'blue',
        ]);
        expect(undoResult.type).toBe('disappears');
        if (undoResult.type === 'disappears') {
            expect(undoResult.disappears).toHaveLength(5);
        }
    });

    it('appear tiles twice', () => {
        const tileFactory = new TileFactory(DEFAULT_CONFIG.colors, []);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            tileFactory,
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd1 = new RefillCommand(game, tileFactory);
        const cmd2 = new RefillCommand(game, tileFactory);
        cmd1.do(game);
        const cmdResult2 = cmd2.do(game);
        expect(cmdResult2.type).toBe('refills');
        if (cmdResult2.type === 'refills') {
            expect(cmdResult2.refills).toHaveLength(0);
        }
    });

    it('appear tiles twice undo latest', () => {
        const tileFactory = new TileFactory(DEFAULT_CONFIG.colors, []);
        const game = new DefaultGame(
            {
                ...DEFAULT_CONFIG,
                width: 4,
                height: 4,
            },
            tileFactory,
            createMockInstance(DefaultCommandFactory),
            new DefaultTileField(4, 4, [
                 empty  ,  empty  , 'red'  , 'purple',
                'blue'  ,  empty  , 'green', 'yellow',
                 empty  ,  empty  , 'green', 'red',
                'purple', 'purple', 'blue' , 'blue',
            ]),
        );
        const cmd1 = new RefillCommand(game, tileFactory);
        const cmd2 = new RefillCommand(game, tileFactory);
        cmd1.do(game);
        cmd2.do(game);
        const undoResult2 = cmd2.undo(game);
        expect(undoResult2.type).toBe('disappears');
        if (undoResult2.type === 'disappears') {
            expect(undoResult2.disappears).toHaveLength(0);
        }
    });
});