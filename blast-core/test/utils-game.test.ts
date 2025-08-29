import { getAffectedPositions } from "../src/utils-game";
import { Game } from "../src";
import { DefaultTileField, TestDefaultTileField } from "../src/TileField";
import { fallTiles, findTouchingTiles, generateNewTiles, hasMoves } from "../src/utils-game";
import { describe, it, expect, xdescribe, xit } from '@jest/globals';

describe('findTouchingTiles', () => {
    it('Just single tile', () => {
        const field = new DefaultTileField(3, 3, [
            'blue', 'blue', 'blue',
            'blue', 'red', 'blue',
            'blue', 'blue', 'blue'
        ]);
        const touching = findTouchingTiles(field, 1, 1, 'red');
        expect(touching).toHaveLength(1);
        expect(touching).toEqual([{ x: 1, y: 1 }]);
    });

    it('Every blue tile except {1;1}', () => {
        const field = new DefaultTileField(3, 3, [
            'blue', 'blue', 'blue',
            'blue', 'red', 'blue',
            'blue', 'blue', 'blue'
        ]);
        const touching = findTouchingTiles(field, 0, 0, 'blue');
        expect(touching).toHaveLength(8);
        expect(touching).toEqual(expect.arrayContaining([
            { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 },
            { x: 1, y: 0 }, { x: 1, y: 2 },
            { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
        ]));
    });

    it('Reds on 10x10 with other reds', () => {
        const field = new DefaultTileField(10, 10, [
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
            'green' , 'purple', 'green', 'green' , 'green' , 'green', 'green', 'green', 'green', 'yellow',
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
            'green' , 'purple', 'green', 'green' , 'green' , 'green', 'green', 'green', 'green', 'yellow',
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
            'green' , 'purple', 'green', 'green' , 'green' , 'green', 'green', 'green', 'green', 'yellow',
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
            'blue'  , 'green' , 'green', 'yellow', 'green' , 'red'  , 'red'  , 'green', 'green', 'blue'  ,
        ]);
        const touching = findTouchingTiles(field, 6, 3, 'red');
        expect(touching).toHaveLength(4);
        expect(touching).toEqual(expect.arrayContaining([
            { x: 5, y: 2 }, { x: 5, y: 3 }, 
            { x: 6, y: 2 }, { x: 6, y: 3},
        ]));
    });
});

describe('fallTiles', () => {
    it('Fall ladder', () => {
        const field = new TestDefaultTileField(6, 6, [
            'empty' , 'empty' , 'empty' , 'empty' , 'empty' , 'empty' ,
            'green' , 'empty' , 'empty' , 'empty' , 'empty' , 'empty' ,
            'blue'  , 'green' , 'empty' , 'empty' , 'empty' , 'empty' ,
            'purple', 'blue'  , 'green' , 'empty' , 'empty' , 'empty' ,
            'green' , 'purple', 'blue'  , 'green' , 'empty' , 'empty' ,
            'yellow', 'green' , 'purple', 'blue'  , 'green' , 'empty' ,
        ]);
        fallTiles(field);
        const fallen = [
            'green' , 'green' , 'green' , 'green' , 'green' , 'empty' ,
            'blue'  , 'blue'  , 'blue'  , 'blue'  , 'empty' , 'empty' ,
            'purple', 'purple', 'purple', 'empty' , 'empty' , 'empty' ,
            'green' , 'green' , 'empty' , 'empty' , 'empty' , 'empty' ,
            'yellow', 'empty' , 'empty' , 'empty' , 'empty' , 'empty' ,
            'empty' , 'empty' , 'empty' , 'empty' , 'empty' , 'empty' ,
        ];
        expect(field.tiles_).toEqual(fallen);
    });

    it('Fall first column two cells', () => {
        const field = new TestDefaultTileField(6, 6, [
            'empty' , 'yellow', 'green' , 'purple', 'blue'  , 'green' ,
            'empty' , 'red'   , 'yellow', 'green' , 'purple', 'blue'  ,
            'blue'  , 'green' , 'red'   , 'yellow', 'green' , 'purple',
            'purple', 'blue'  , 'green' , 'red'   , 'yellow', 'green' ,
            'green' , 'purple', 'blue'  , 'green' , 'red'   , 'yellow',
            'yellow', 'green' , 'purple', 'blue'  , 'green' , 'red'   ,
        ]);
        fallTiles(field);
        const fallen = [
            'blue'  , 'yellow', 'green' , 'purple', 'blue'  , 'green' ,
            'purple', 'red'   , 'yellow', 'green' , 'purple', 'blue'  ,
            'green' , 'green' , 'red'   , 'yellow', 'green' , 'purple',
            'yellow', 'blue'  , 'green' , 'red'   , 'yellow', 'green' ,
            'empty' , 'purple', 'blue'  , 'green' , 'red'   , 'yellow',
            'empty' , 'green' , 'purple', 'blue'  , 'green' , 'red'   ,
        ];
        expect(field.tiles_).toEqual(fallen);
    });

    it('Fall last column two cells', () => {
        const field = new TestDefaultTileField(6, 6, [
            'red'   , 'yellow', 'green' , 'purple', 'blue'  , 'empty' ,
            'green' , 'red'   , 'yellow', 'green' , 'purple', 'empty' ,
            'blue'  , 'green' , 'red'   , 'yellow', 'green' , 'purple',
            'purple', 'blue'  , 'green' , 'red'   , 'yellow', 'green' ,
            'green' , 'purple', 'blue'  , 'green' , 'red'   , 'yellow',
            'yellow', 'green' , 'purple', 'blue'  , 'green' , 'red'   ,
        ]);
        fallTiles(field);
        const fallen = [
            'red'   , 'yellow', 'green' , 'purple', 'blue'  , 'purple',
            'green' , 'red'   , 'yellow', 'green' , 'purple', 'green' ,
            'blue'  , 'green' , 'red'   , 'yellow', 'green' , 'yellow',
            'purple', 'blue'  , 'green' , 'red'   , 'yellow', 'red'   ,
            'green' , 'purple', 'blue'  , 'green' , 'red'   , 'empty' ,
            'yellow', 'green' , 'purple', 'blue'  , 'green' , 'empty' ,
        ];
        expect(field.tiles_).toEqual(fallen);
    });

    it('Fall first and last column two cells', () => {
        const field = new TestDefaultTileField(6, 6, [
            'empty' , 'yellow', 'green' , 'purple', 'blue'  , 'empty' ,
            'empty' , 'red'   , 'yellow', 'green' , 'purple', 'empty' ,
            'blue'  , 'green' , 'red'   , 'yellow', 'green' , 'purple',
            'purple', 'blue'  , 'green' , 'red'   , 'yellow', 'green' ,
            'green' , 'purple', 'blue'  , 'green' , 'red'   , 'yellow',
            'yellow', 'green' , 'purple', 'blue'  , 'green' , 'red'   ,
        ]);
        fallTiles(field);
        const fallen = [
            'blue'  , 'yellow', 'green' , 'purple', 'blue'  , 'purple',
            'purple', 'red'   , 'yellow', 'green' , 'purple', 'green' ,
            'green' , 'green' , 'red'   , 'yellow', 'green' , 'yellow',
            'yellow', 'blue'  , 'green' , 'red'   , 'yellow', 'red'   ,
            'empty' , 'purple', 'blue'  , 'green' , 'red'   , 'empty' ,
            'empty' , 'green' , 'purple', 'blue'  , 'green' , 'empty' ,
        ];
        expect(field.tiles_).toEqual(fallen);
    });

    it('Fall with block between burned ones', () => {
        const field = new TestDefaultTileField(4, 4, [
            'empty', 'empty' , 'green' , 'blue',
            'blue' , 'empty' , 'yellow', 'blue',
            'empty', 'empty' , 'purple', 'green',
            'green', 'yellow', 'blue'  , 'yellow',
        ]);
        fallTiles(field);
        const fallen = [
            'blue' , 'yellow', 'green' , 'blue',
            'green', 'empty' , 'yellow', 'blue',
            'empty', 'empty' , 'purple', 'green',
            'empty', 'empty' , 'blue'  , 'yellow',
        ];
        expect(field.tiles_).toEqual(fallen);
    });
});

describe('generateNewTiles', () => {
    const colors = ['red', 'green', 'blue', 'purple', 'yellow'];
    const randomTile = () => colors[Math.floor(Math.random() * colors.length)];
    it('generate for empty', () => {
        const field = new TestDefaultTileField(4, 4, [
            'red'   , 'empty' , 'green' , 'purple',
            'green' , 'red'   , 'empty' , 'green' ,
            'empty' , 'empty' , 'red'   , 'yellow',
            'purple', 'blue'  , 'empty' , 'red'   ,
        ]);
        generateNewTiles(field, randomTile);
        expect(field.tiles_).not.toContain('empty' satisfies Game.TileKind);
    });
});

describe('hasMoves', () => {
    it('has one move', () => {
        const field = new DefaultTileField(2, 2, [
            'red'   , 'red'  ,
            'yellow', 'green',
        ]);
        const isHasMoves = hasMoves(field, () => false);
        expect(isHasMoves).toBeTruthy();
    });

    it('has no move', () => {
        const field = new DefaultTileField(2, 2, [
            'red'   , 'blue'  ,
            'yellow', 'green',
        ]);
        const isHasMoves = hasMoves(field, () => false);
        expect(isHasMoves).toBeFalsy();
    });
});

describe('getAffectedPositions', () => {
    it ('Raw affected positions', () => {
        const affected = getAffectedPositions(5, 3, 10, 10, [
            { 
                id: 'burn', 
                burns: [
                    [{x: 'e', y: 0}, {x: 'e', y: 0}]
                ]
            }
        ]);
        expect(affected).toEqual(expect.arrayContaining([
            { x: 0, y: 3 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
            { x: 3, y: 3 },
            { x: 4, y: 3 },
            { x: 6, y: 3 },
            { x: 7, y: 3 },
            { x: 8, y: 3 },
            { x: 9, y: 3 },
        ]));
    });

    it ('Column affected positions', () => {
        const affected = getAffectedPositions(5, 3, 10, 10, [
            { 
                id: 'burn', 
                burns: [
                    [{x: 0, y: 'e'}, {x: 0, y: 'e'}]
                ]
            }
        ]);
        expect(affected).toEqual(expect.arrayContaining([
            { x: 5, y: 0 },
            { x: 5, y: 1 },
            { x: 5, y: 2 },
            { x: 5, y: 4 },
            { x: 5, y: 5 },
            { x: 5, y: 6 },
            { x: 5, y: 7 },
            { x: 5, y: 8 },
            { x: 5, y: 9 },
        ]));
    });

    it ('Around affected positions', () => {
        const affected = getAffectedPositions(5, 3, 10, 10, [
            { 
                id: 'burn', 
                burns: [
                    [{x: -1, y: -1}, {x: 1, y: 1}]
                ]
            }
        ]);
        expect(affected).toEqual(expect.arrayContaining([
            { x: 4, y: 2 },
            { x: 5, y: 2 },
            { x: 6, y: 2 },
            { x: 4, y: 3 },
            { x: 6, y: 3 },
            { x: 4, y: 4 },
            { x: 5, y: 4 },
            { x: 6, y: 4 },
        ]));
    });

    it ('All affected positions', () => {
        const affected = getAffectedPositions(5, 3, 10, 10, [
            { 
                id: 'burn', 
                burns: [
                    [{x: 'e', y: 'e'}, {x: 'e', y: 'e'}]
                ]
            }
        ]);
        const testAffected = Array.from({ length: 100 }, (_, i) => {
            const x = i % 10;
            const y = Math.floor(i / 10);
            return { x, y };
        }).filter(p => !(p.x === 5 && p.y === 3));
        expect(affected).toEqual(expect.arrayContaining(testAffected));
    });
});
