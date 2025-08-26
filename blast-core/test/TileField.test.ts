import { describe, it, expect } from '@jest/globals';
import { DefaultTileField } from '../src/TileField';
import { TileKind } from '../src/Tile';
import { TileFactory } from '../src/TileFactory';

const colors: TileKind[] = ['red', 'green', 'blue', 'purple', 'yellow'];

describe('TileField', () => {
    it('getTile(0, 0)', () => {
        const tileField = new DefaultTileField(2, 3, [
            'red', 'green',
            'blue', 'purple',
            'green', 'yellow',
        ]);
        const tile = tileField.getTile(0, 0);
        expect(tile).toBe('red' satisfies TileKind);
    });

    it('getTile(1, 2)', () => {
        const tileField = new DefaultTileField(2, 3, [
            'red', 'green',
            'blue', 'purple',
            'green', 'yellow',
        ]);
        const tile = tileField.getTile(1, 2);
        expect(tile).toBe('yellow' satisfies TileKind);
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