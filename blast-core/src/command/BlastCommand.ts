import { Game } from "../Game";
import { TileField } from "../TileField";
import { Command } from "./Command";

const EMPTY_BLASTS_RESULT: Omit<Command.BlastResult, 'position'> = {
    type: 'blasts',
    blasts: [],
};
const EMPTY_APPEARS_RESULT: Command.AppearsResult = {
    type: 'appears',
    appears: [],
};

export class BlastCommand implements Command {

    private blastingPositions: Game.TilePosition[];

    constructor(
        tileField: TileField, 
        private position: Game.Position,
        private movesCost: number = Command.DEFAULT_MOVES_DIFF,
    ) {
        this.blastingPositions = this.findTouchingTiles(tileField, position.x, position.y);
    }

    do(game: Game): Command.Result {
        if (this.blastingPositions.length <= 1) {
            return {
                position: this.position,
                ...EMPTY_BLASTS_RESULT
            };
        }
        for (const blastPos of this.blastingPositions) {
            game.setTile(blastPos.x, blastPos.y, Game.EMPTY_TILE);
        }
        const scoreDiff = this.blastingPositions.length;
        game.setScore(game.getScore() + scoreDiff);
        game.setMovesLeft(game.getMovesLeft() - this.movesCost);
        return {
            type: 'blasts',
            blasts: this.blastingPositions,
            position: this.position,
            scoreDiff: scoreDiff,
            movesDiff: -this.movesCost,
        };
    }

    undo(game: Game): Command.Result {
        if (this.blastingPositions.length <= 1) {
            return EMPTY_APPEARS_RESULT;
        }
        for (const blastPos of this.blastingPositions) {
            game.setTile(blastPos.x, blastPos.y, blastPos.tile);
        }
        const scoreDiff = -this.blastingPositions.length;
        game.setScore(game.getScore() + scoreDiff);
        game.setMovesLeft(game.getMovesLeft() + this.movesCost);
        return {
            type: 'appears',
            appears: this.blastingPositions,
            scoreDiff: scoreDiff,
            movesDiff: this.movesCost,
        };
    }

    private findTouchingTiles(
        tileField: TileField,
        x: number, 
        y: number,
    ): Game.TilePosition[] {
        const targetTile = tileField.getTile(x, y);
        if (targetTile === undefined) {
            return [];
        }
        const touching: Game.TilePosition[] = [{x, y, tile: targetTile}];
        const edges: Game.Position[] = [{x, y}];
        
        for (;;) {
            const found: Game.TilePosition[] = [];
    
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
                    if (tile === undefined || touchingIdx >= 0 || foundIdx >= 0 || tile !== targetTile) {
                        continue;
                    }
    
                    found.push({ ...aroundEdge, tile });
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
}