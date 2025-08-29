import { TileField } from './TileField';
import { Game } from './Game';

export function findTouchingTiles(
    tileField: TileField,
    x: number, 
    y: number, 
    tile: Game.TileKind, 
    targetTiles: Game.TileKind[] = [tile],
): Game.Position[] {
    const touching: Game.Position[] = [{x, y}];
    const edges: Game.Position[] = [{x, y}];
    
    for (;;) {
        const found: Game.Position[] = [];

        for (const edge of edges) {
            const aroundEdges: Game.Position[] = [
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

export function fallTiles(tileField: TileField): [Game.Position, Game.Position][] {
    const moves: [Game.Position, Game.Position][] = [];
    for (let x = 0; x < tileField.width; x++) {
        for (let y = 0; y < tileField.height; y++) {
            const tile = tileField.getTile(x, y);
            if (!Game.isTileEmpty(tile)) {
                continue;
            }
            for (let fallY = y + 1; fallY < tileField.height; fallY++) {
                const fallTile = tileField.getTile(x, fallY);
                if (Game.isTileEmpty(fallTile) || fallTile === undefined) {
                    continue;
                }
                tileField.setTile(x, y, fallTile);
                tileField.setTile(x, fallY, Game.EMPTY_TILE);
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

export function generateNewTiles(
    tileField: TileField,
    createRandomColorTile: () => Game.TileKind,
): Game.TilePosition[] {
    const gens: Game.TilePosition[] = [];
    for (let x = 0; x < tileField.width; x++) {
        for (let y = 0; y < tileField.height; y++) {
            if (tileField.getTile(x, y) === Game.EMPTY_TILE) {
                const tile = createRandomColorTile();
                tileField.setTile(x, y, tile);
                gens.push({ x, y, tile });
            }
        }
    }
    return gens;
}

export function hasMoves(
    tileField: TileField,
    isSuperTile: (t: Game.TileKind) => boolean,
): boolean {
    for (let x = 0; x < tileField.width; x++) {
        for (let y = 0; y < tileField.height; y++) {
            const tile = tileField.getTile(x, y);
            if (!tile) {
                throw new Error(`Unexpected ${tile} tile`);
            }
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
    tileX: number, 
    tileY: number,
    tilesWidth: number,
    tilesHeight: number,
    actions: Game.Action[],
): Game.Position[] {
    const positions: Game.Position[] = [];
    const isValid = (x: number, y: number): boolean => {
        return (x !== tileX || y !== tileY) 
            && x >= 0
            && y >= 0
            && x < tilesWidth
            && y < tilesHeight
            && positions.findIndex(p => p.x === x && p.y === y) === -1;
    };
    for (const action of actions) {
        switch (action.id) {
            case 'burn':
                const burnPositions = getBurnPositions(tileX, tileY, tilesWidth, tilesHeight, action, isValid);
                positions.push(...burnPositions);
                break;
        }
    }
    return positions;
}

function getBurnPositions(
    tileX: number, 
    tileY: number,
    tilesWidth: number,
    tilesHeight: number,
    action: Game.BurnAction,
    isValid: (x: number, y: number) => boolean,
): Game.Position[] {
    const positions: Game.Position[] = [];
    for (const burn of action.burns) {
        if (Game.isPosition(burn)) {
            if (isValid(burn.x, burn.y)) {
                positions.push(burn);
            }
            continue;
        }

        const fromX = burn[0].x === 'e' ? 0 : Math.max(tileX + burn[0].x, 0);
        const toX = burn[1].x === 'e' ? tilesWidth - 1 : Math.min(tileX + burn[1].x, tilesWidth - 1);
        const fromY = burn[0].y === 'e' ? 0 : Math.max(tileY + burn[0].y, 0);
        const toY = burn[1].y === 'e' ? tilesHeight - 1 : Math.min(tileY + burn[1].y, tilesHeight - 1);
        for (let x = fromX; x <= toX; x++) {
            for (let y = fromY; y <= toY; y++) {
                if (isValid(x, y)) {
                    positions.push({ x, y });
                }
            }
        }
    }
    return positions;
}
