import { 
    isSuperTile,
    Position, 
    TILE_COLORS, 
    TILE_SUPERS, 
    TileColor, 
    TileKind,
    TileSuper, 
} from "./Tile";
import { TileField } from "./TileField";

export function createRandomColorTile(): typeof TILE_COLORS[number] {
    const tileColor = TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)];
    if (tileColor === undefined) {
        throw new Error("Unexpected undefined tile color");
    }
    return tileColor;
}

export function createRandomSuperTile(): typeof TILE_SUPERS[number] {
    const tileSuper = TILE_SUPERS[Math.floor(Math.random() * TILE_SUPERS.length)];
    if (tileSuper === undefined) {
        throw new Error("Unexpected undefined tile color");
    }
    return tileSuper;
}

export function findTouchingTiles(
    tileField: TileField,
    x: number, 
    y: number, 
    tile: TileColor, 
    targetTiles: TileKind[] = [tile],
): Position[] {
    const touching: Position[] = [{x, y}];
    const edges: Position[] = [{x, y}];
    
    for (;;) {
        const found: Position[] = [];

        for (const edge of edges) {
            const aroundEdges: Position[] = [
                { x: edge.x, y: edge.y + 1 },
                { x: edge.x - 1, y: edge.y },
                { x: edge.x + 1, y: edge.y },
                { x: edge.x, y: edge.y - 1 },
            ];
            for (const aroundEdge of aroundEdges) {
                const tile = tileField.getTile(aroundEdge.x, aroundEdge.y);
                const touchingIdx = touching.findIndex((p) => p.x === aroundEdge.x && p.y === aroundEdge.y);
                const foundIdx = found.findIndex((p) => p.x === aroundEdge.x && p.y === aroundEdge.y);
                if (tile === undefined || touchingIdx >= 0 || foundIdx >= 0 || targetTiles.indexOf(tile) === -1) {
                    continue;
                }

                found.push(aroundEdge);
            }
        }

        if (found.length === 0) {
            break;
        }

        touching.push(...found);
        edges.splice(0, edges.length);
        edges.push(...found);
    }
    
    return touching;
}

export function fallTiles(tileField: TileField): [Position, Position][] {
    const moves: [Position, Position][] = [];
    for (let x = 0; x < tileField.width; x++) {
        for (let y = 0; y < tileField.height; y++) {
            const tile = tileField.getTile(x, y);
            if (tile !== 'empty' && tile !== undefined) {
                continue;
            }
            for (let fallY = y + 1; fallY < tileField.height; fallY++) {
                const fallTile = tileField.getTile(x, fallY);
                if (fallTile === 'empty' || fallTile === undefined) {
                    continue;
                }
                tileField.setTile(x, y, fallTile);
                tileField.setTile(x, fallY, 'empty');
                moves.push([
                    { x: x, y: fallY },
                    { x: x, y: y },
                ]);
                break;
            }
        }
    }
    return moves;
}

export function generateNewTiles(tileField: TileField): (Position & { tile: TileColor })[] {
    const gens: (Position & { tile: TileColor })[] = [];
    for (let x = 0; x < tileField.width; x++) {
        for (let y = 0; y < tileField.height; y++) {
            if (tileField.getTile(x, y) === 'empty') {
                const tile = createRandomColorTile();
                tileField.setTile(x, y, tile);
                gens.push({
                    x,
                    y,
                    tile,
                });
            }
        }
    }
    return gens;
}

export function hasMoves(tileField: TileField): boolean {
    for (let x = 0; x < tileField.width; x++) {
        for (let y = 0; y < tileField.height; y++) {
            const tile = tileField.getTile(x, y);
            if (isSuperTile(tile)) {
                return true;
            }
            const adjacentTiles = [
                tileField.getTile(x - 1, y),
                tileField.getTile(x + 1, y),
                tileField.getTile(x, y - 1),
                tileField.getTile(x, y + 1),
            ];
            if (adjacentTiles.indexOf(tile) >= 0) {
                return true;
            }
        }
    }
    return false;
}

export function getAffectedPositions(
    x: number, 
    y: number, 
    tile: TileSuper,
    tilesWidth: number,
    tilesHeight: number,
): Position[] {
    const positions: Position[] = [];
    switch (tile) {
        case "burn_raw":
            for (let i = 0; i < tilesWidth; i++) {
                if (i === x) {
                    continue;
                }
                positions.push({ x: i, y });
            }
            break;
        case "burn_column":
            for (let i = 0; i < tilesHeight; i++) {
                if (i === y) {
                    continue;
                }
                positions.push({ x, y: i });
            }
            break;
        case "burn_around":
            for (let i = x - 1; i <= x + 1; i++) {
                for (let j = y - 1; j <= y + 1; j++) {
                    if (i === x && j === y || x < 0 || x >= tilesWidth || y < 0 || y >= tilesHeight) {
                        continue;
                    }
                    positions.push({ x: i, y: j });
                }
            }
            break;
        case "burn_all":
            for (let i = 0; i < tilesWidth; i++) {
                for (let j = 0; j < tilesHeight; j++) {
                    if (i === x && j === y) {
                        continue;
                    }
                    positions.push({ x: i, y: j });
                }
            }
            break;
    }
    return positions;
}