import { TileKind } from "./Tile";

export interface TileField {
    readonly width: number;
    readonly height: number;
    getTile(x: number, y: number): TileKind | undefined;
    setTile(x: number, y: number, kind: TileKind): void;
}

export class DefaultTileField implements TileField {

    constructor(
        public readonly width: number, 
        public readonly height: number,
        private tiles: TileKind[],
    ) {}

    public getTile(x: number, y: number): TileKind | undefined {
        if (x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1) {
            return undefined;
        }
        return this.tiles[y * this.width + x];
    }

    public setTile(x: number, y: number, kind: TileKind) {
         if (x < 0 || y < 0 || x > this.width - 1 || y > this.height - 1) {
            return;
         }
         this.tiles[y * this.width + x] = kind;
    }
}

export class TestDefaultTileField extends DefaultTileField {

    constructor(
        width: number, 
        height: number,
        public readonly tiles_: TileKind[] = [],
    ) {
        super(width, height, tiles_);
    }
}