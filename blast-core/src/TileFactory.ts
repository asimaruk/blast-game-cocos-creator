import { Game } from './Game';

export class TileFactory {
    constructor(
        private readonly tileColors: Game.TileKind[],
        private readonly superTiles: Game.TileKind[],
    ) {}

    createRandomColorTile(): Game.TileKind {
        const tileColor = this.tileColors[Math.floor(Math.random() * this.tileColors.length)];
        if (tileColor === undefined) {
            throw new Error("Unexpected undefined tile color");
        }
        return tileColor;
    }
    
    createRandomSuperTile(): Game.TileKind {
        const tileSuper = this.superTiles[Math.floor(Math.random() * this.superTiles.length)];
        if (tileSuper === undefined) {
            throw new Error("Unexpected undefined tile color");
        }
        return tileSuper;
    }

    createRandomColors(count: number): Game.TileKind[] {
        return Array.from({ length: count }, () => this.createRandomColorTile());
    }
}