import { describe, it, expect } from '@jest/globals';
import { DefaultTileField } from '../src/TileField';
import { TileColor } from '../src/Tile';

describe('TileField', () => {
    it('getTile(0, 0)', () => {
        const tileField = new DefaultTileField(2, 3, [
            'red', 'green',
            'blue', 'purple',
            'green', 'yellow',
        ]);
        const tile = tileField.getTile(0, 0);
        expect(tile).toBe('red' satisfies TileColor);
    });

    it('getTile(1, 2)', () => {
        const tileField = new DefaultTileField(2, 3, [
            'red', 'green',
            'blue', 'purple',
            'green', 'yellow',
        ]);
        const tile = tileField.getTile(1, 2);
        expect(tile).toBe('yellow' satisfies TileColor);
    });

    it('getTile() defined', () => {
        const tileField = new DefaultTileField(2, 3);
        const tile = tileField.getTile(1, 2);
        expect(tile).toBeDefined();
    });

    it('getTile() undefined', () => {
        const tileField = new DefaultTileField(2, 3);
        const tile = tileField.getTile(1, 3);
        expect(tile).toBeUndefined();
    });
});