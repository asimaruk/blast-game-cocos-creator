import { TileKind } from "./Tile";

export class TileFactory {
    constructor(
        private readonly tileColors: TileKind[],
        private readonly superTiles: TileKind[],
    ) {}

    createRandomColorTile(): TileKind {
        const tileColor = this.tileColors[Math.floor(Math.random() * this.tileColors.length)];
        if (tileColor === undefined) {
            throw new Error("Unexpected undefined tile color");
        }
        return tileColor;
    }
    
    createRandomSuperTile(): TileKind {
        const tileSuper = this.superTiles[Math.floor(Math.random() * this.superTiles.length)];
        if (tileSuper === undefined) {
            throw new Error("Unexpected undefined tile color");
        }
        return tileSuper;
    }

    createRandomColors(count: number): TileKind[] {
        return Array.from({ length: count }, () => this.createRandomColorTile());
    }
}