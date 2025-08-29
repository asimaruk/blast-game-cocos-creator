import { describe, it, expect } from '@jest/globals';
import { DefaultTileField } from '../src/TileField';
import { TileFactory } from '../src/TileFactory';
import { Game } from '../src';

const colors: Game.TileKind[] = ['red', 'green', 'blue', 'purple', 'yellow'];

describe('TileField', () => {
    it('getTile(0, 0)', () => {
        const tileField = new DefaultTileField(2, 3, [
            'red', 'green',
            'blue', 'purple',
            'green', 'yellow',
        ]);
        const tile = tileField.getTile(0, 0);
        expect(tile).toBe('red' satisfies Game.TileKind);
    });

    it('getTile(1, 2)', () => {
        const tileField = new DefaultTileField(2, 3, [
            'red', 'green',
            'blue', 'purple',
            'green', 'yellow',
        ]);
        const tile = tileField.getTile(1, 2);
        expect(tile).toBe('yellow' satisfies Game.TileKind);
    });

    it('getTile() defined', () => {
        const factory = new TileFactory(colors, []);
        const tileField = new DefaultTileField(2, 3, factory.createRandomColors(6));
        const tile = tileField.getTile(1, 2);
        expect(tile).toBeDefined();
    });

    it('getTile() undefined', () => {
        const factory = new TileFactory(colors, []);
        const tileField = new DefaultTileField(2, 3, factory.createRandomColors(6));
        const tile = tileField.getTile(1, 3);
        expect(tile).toBeUndefined();
    });
});